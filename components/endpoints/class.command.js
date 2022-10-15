const Joi = require("joi");
const mongodb = require("mongodb");

const _timeout = require("../../helper/timeout.js");
const { interfaces } = require("../../system/shared.js");


/**
 * @description
 * Single command
 * 
 * @class Command
 * 
 * @param {Object} obj Object that matches the item schema. See properties below:
 * 
 * @property {String} [_id=ObjectID] MongoDB ObjectID as String
 * @property {String} interface Device Interface `_id`
 * @property {String} name Human friendly name
 * @property {String} alias Machine friendly name, e.g.: `POWER_ON`
 * @property {String} [identifier=null] Simple/custom identifiert for custom command handler
 * @property {String} payload The payload to send over the device interface
 * @property {String} [description=""] Command description, displayed on the frontend
 * @property {Array} params Possible parameter for the command
 * @property {String} params[].key Custom key
 * @property {Any} params[].value Value to set
 * @property {String} params[].default Default thing if nothing is send from client
 * @property {String} params[].min Min value if param type is a number
 * @property {String} params[].max Max value if param type is a number
 * 
 * @example 
 * ```json
{
    _id: "604a75e6eb5de037846df24c",
    name: "Power On",                           // Human redable
    alias: "POWER_ON",                          // Something you can easy reminder, e.g for register handling callbacks
    //identifier: "1",                            // Something your devices sets/needs 
    payload: "PWR01",                           // Payload that gets send raw to the device
    description: "",                            // should be self-explanatory]
    interface: "603fe5d18791152879a9babd"
}, {
    _id: "604a75e6eb5de037846df24d",
    name: "Power Off",                          // Human redable
    alias: "POWER_OFF",                         // Something you can easy reminder, e.g for register handling callbacks
    //identifier: "2",                            // Something your devices sets/needs 
    payload: "PWR00",                           // Payload that gets send raw to the device
    description: "",                            // should be self-explanatory  
    interface: "603fe5d18791152879a9babd"
}, {
    _id: "60546eaff7d8a2b752330b37",
    name: "Master Volume",       // Human redable
    alias: "MASTER_VOLUME",      // Something you can easy reminder, e.g for register handling callbacks
    //identifier: "4",        // Something your devices sets/needs 
    payload: "MVL${v}",       // Payload that gets send raw to the device
    description: "",
    params: [{
        key: "v",
        min: 0,
        max: 100,
        default: 35
    }],
    interface: "603fe5d18791152879a9babd"
}, {
    _id: "604a75e6eb5de037846df24e",
    name: "Mute (Toggle)",
    //alias: "",
    payload: "AMTTG",
    interface: "603fe5d18791152879a9babd"
}
  ```
 */
module.exports = class Command {

    #privates = new Map();

    constructor(obj) {

        Object.assign(this, obj);
        this._id = String(obj._id);

        // command duration timeout
        this.#privates.set("timeout", Number(process.env.COMMAND_RESPONSE_TIMEOUT));

        // set default command handler worker function
        this.#privates.set("handler", (cmd, iface, params, done) => {

            if (!cmd.payload) {
                done(new Error("NO_PAYLOAD_DEFINED"));
                return;
            }

            iface.write(cmd.payload, (err) => {
                if (err) {

                    done(err);

                } else {

                    iface.once("data", (chunk) => {

                        // read chunk
                        //let chunk = iface.read();
                        let regex = new RegExp(/success|ok|1|true/, "gimu");

                        // compare respond with command payload
                        if ((chunk && chunk === cmd.payload) || regex.test(chunk)) {

                            done(null, true);

                        } else {

                            done(null, null);

                        }

                    });

                }
            });

        });

    }


    /**
     * @function setHandler
     * Set the handler function that implements the command sepcific execution
     * 
     * @param {Function} handler 
     */
    setHandler(handler) {
        this.#privates.set("handler", handler);
    }


    /**
     * @function getHandler
     * Get the handler function that is currently set
     * 
     * @returns {Function} Setted handler function
     */
    getHandler() {
        return this.#privates.get("handler");
    }


    /**
     * @function setTimeout
     * Set the duration of a command timeout
     * 
     * @param {Number} n Timeout in msec
     */
    setTimeout(n) {
        this.#privates.set("timeout", n);
    }


    /**
     * @function getTimeout
     * Returns the setted timeout
     * 
     * @returns {Number} Timeout in msec
     */
    getTimeout() {
        return this.#privates.get("timeout");
    }


    /**
     * @function trigger
     * Calls the handler function and trigger the command execution
     * 
     * @param {Array} [params] Parameter array
     * @param {Function} [cb] Callback
     */
    trigger(params, cb = () => { }) {

        if (!cb && params instanceof Function) {
            cb = params;
            params = [];
        }

        let worker = this.#privates.get("handler");
        let iface = interfaces.get(this.interface);

        let timer = _timeout(this.#privates.get("timeout"), (timedout, duration, args) => {
            if (timedout) {

                console.log("Command timedout! Execution was not successful, worker function:", worker);
                cb(null, false);

            } else {

                console.log("Command handler executed", duration, args);
                cb(...args);

            }
        });

        // handle timeout stuff here?
        // when so, timeout applys to custom functions too!
        worker.call(this, this, iface, params, timer);

    }


    /**
     * @function schema
     * Command schema
     * 
     * @static
     * 
     * @returns {Object} Joi Object
     */
    static schema() {
        return Joi.object({
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return String(new mongodb.ObjectID());
            }),
            interface: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),                       // device interface mongodb _id
            name: Joi.string().required(),                                              // Command name, something easy to identify
            alias: Joi.string().required(),                                             // Alias that you can rely in your plugins, machine to machine/hardcoded stuff
            identifier: Joi.string().allow(null).default(null),   // NOTE: move to endpoint schema?               // Thing api provides you, like light id or some custom thing for you
            payload: Joi.string().allow(null).default(null),
            description: Joi.string().allow(null).default(null),
            params: Joi.array().items({
                key: Joi.string().required(),
                value: Joi.any(),
                default: Joi.string(),
                min: Joi.number(),
                max: Joi.number()
            })
        });
    }


    /**
     * @function validate
     * Validate schema object
     * 
     * @param {Object} obj Input data to validate
     * 
     * @static
     * 
     * @link https://joi.dev/api/?v=17.6.0#anyvalidatevalue-options
     * 
     * @returns {Object} Joi validation response 
     */
    static validate(obj) {
        return Command.schema().validate(obj);
    }

};