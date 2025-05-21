const Joi = require("joi");
const mongodb = require("mongodb");

const _timeout = require("../../helper/timeout.js");
const { interfaces } = require("../../system/shared.js");

const Param = require("./class.param.js");
const Params = require("./class.params.js");

const { parentPort, isMainThread } = require("worker_threads");
const { commands } = require("../../system/worker/shared.js");
const { randomUUID } = require("crypto");

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
 * @property {String|Buffer} payload The payload to send over the device interface
 *
 * @property {Number} [params[].min=0] Min value if param type is a number (`type=number`)
 * @property {Number} [params[].max=100] Max value if param type is a number (`type=number`)
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

        // "convert" mongodb Binary to Buffer
        // see #249 & #200
        // move from rest-handler here
        if (obj.payload instanceof mongodb.Binary) {
            this.payload = obj.payload.read(0);
        }

        // fix #383
        obj.params?.forEach((param, i, arr) => {
            if (!(param instanceof Param)) {
                arr[i] = new Param(param);
            }
        });


        if (process.env.WORKER_THREADS_ENABLED === "true" && !isMainThread) {
            parentPort.on("message", (msg) => {
                if (msg.component === "endpoints" && msg.type === "request" && msg.method === "trigger" && msg.command === this._id) {

                    //console.log("Received command trigger request", msg);

                    this.trigger(msg.params, (...args) => {

                        //console.log("TRigger executed", args);

                        parentPort.postMessage({
                            uuid: msg.uuid,
                            type: "response",
                            method: "trigger",
                            args
                        });

                    });

                }
            });
        }


        // command duration timeout
        this.#privates.set("timeout", Number(process.env.COMMAND_RESPONSE_TIMEOUT));

        // set default command handler worker function
        this.#privates.set("handler", (cmd, iface, params, done) => {

            let err = new Error("DEFAULT_COMMAND_HANDLER_REMOVED");

            done(err);
            //throw err;

            /*
            if (!cmd.payload) {
                done(new Error("NO_PAYLOAD_DEFINED"));
                return;
            }

            // switched to `iface.stream.write`
            // `.stream` should implement the needed adapter stack
            stream.write(cmd.payload, (err) => {
                if (err) {

                    done(err);

                } else {


                    // NOTE: define timeout here
                    // timeout sould only apply when the data was written
                    // not when `.trigger()` was called, see #500

                    stream.once("data", (chunk) => {

                        // read chunk
                        //let chunk = iface.read();
                        let regex = new RegExp(/success|ok|1|true/, "gimu");

                        // compare respond with command payload
                        if ((chunk && chunk === cmd.payload) || regex.test(chunk?.toString())) {

                            done(null, true);

                        } else {

                            done(null, null);

                        }

                    });

                }
            });
            */

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

        if (!isMainThread) {
            parentPort.postMessage({
                component: "endpoints",
                method: "setHandler",
                command: this._id
            });
        }

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
    trigger(params, cb) {

        // when kein worker thread enabled, alles sinlge process = defualt beaufer
        // wenn worker thread prüfen ob im main oder worker
        // when main = post to worker
        // when worker = handler like default beaufer

        let wrapper = () => {

            let { events, logger } = Command.scope;
            logger.verbose(`Trigger command "${this.name}"`, this);

            if (!cb && params instanceof Function) {
                cb = params;
                params = [];
            }

            if (!params && !cb) {
                params = [];
                cb = () => { };
            }

            let worker = this.#privates.get("handler");
            let iface = interfaces.get(this.interface);

            // moved up, and used as callback debounce function
            // see #528, timeout helper has a internal "called" flag
            let timer = _timeout(this.#privates.get("timeout"), (timedout, duration, args) => {
                if (timedout) {

                    logger.warn(`Command timedout for "${this._id}"! Execution was not successful, worker function:`, worker);
                    cb(null, false);

                } else {

                    logger.debug(`Command handler for "${this._id}" executed in ${duration}ms, arguments:`, args);
                    cb(...args);

                }
            });

            try {
                params = params.map((obj) => {

                    let param = this.params.find((param) => {
                        return param.key === obj.key;
                    });

                    if (!param) {
                        return obj;
                    }

                    return Param.merge(param, obj);

                });
            } catch (err) {

                logger.warn(err, `Passed params to command "${this.name}" are invalid`, params);

                timer(err, false);
                return;

            }

            // convert to params array with .lean method
            params = new Params(...params);

            if (!iface) {
                let err = new Error(`Interface "${this.interface}" not found, cant write to it.`);
                err.code = "NO_INTERFACE";
                return timer(err, false);
            }

            // emit command event, see #529
            events.emit("command", this, params);

            // handle timeout stuff here?
            // when so, timeout applys to custom functions too!
            worker.call(this, this, iface, params, timer);

        };

        if (process.env.WORKER_THREADS_ENABLED === "true") {
            if (isMainThread) {

                // im main
                // post message to worker
                if (commands.has(this._id)) {

                    let worker = commands.get(this._id);
                    let uuid = randomUUID();

                    worker.postMessage({
                        component: "endpoints",
                        method: "trigger",
                        params,
                        type: "request",
                        uuid,
                        command: this._id
                    });

                    let messageHandler = (msg) => {
                        if (msg.type === "response" && msg.uuid === uuid && msg.method === "trigger") {

                            //console.log("cmd Response received", msg)

                            worker.off("messsage", messageHandler);
                            Reflect.apply(cb, this, msg.args);

                        }
                    };

                    worker.on("message", messageHandler);

                } else {

                    console.log("No hanlder registered");

                }

            } else {

                // in worker
                wrapper();

            }
        } else {

            // in main
            wrapper();

        }

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
                return String(new mongodb.ObjectId());
            }),
            interface: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),                       // device interface mongodb _id
            name: Joi.string().required(),                                              // Command name, something easy to identify
            alias: Joi.string().required(),                                             // Alias that you can rely in your plugins, machine to machine/hardcoded stuff
            identifier: Joi.string().allow(null).default(null),   // NOTE: move to endpoint schema?               // Thing api provides you, like light id or some custom thing for you
            //payload: Joi.string().allow(null).default(null),
            payload: Joi.alternatives().try(Joi.string(), Joi.binary()).allow(null).default(null),
            description: Joi.string().allow(null).default(null),
            params: Joi.array().items(Param.schema()).default([])
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