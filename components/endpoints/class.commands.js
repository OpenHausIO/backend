const Hooks = require("../../system/hooks");
const timeout = require("../../helper/timeout");
const Command = require("./class.command.js");

// NOTE: create request/response classes for commands like http?
module.exports = class Commands extends Array {

    /**
     * Commands object, array like
     * @constructor
     * @param {Array} arr Command objects
     */
    constructor(arr) {

        super();


        // without this, <this>.map throws type error:
        // TypeError: items.forEach is not a function
        // <items> is when map function is called a number
        if (arr instanceof Array) {
            arr.forEach((obj) => {
                this.push(new Command(obj));
            });
        }


        Object.defineProperty(this, "handler", {
            value: new Map(),
            configurable: false
        });

        Object.defineProperty(this, "hooks", {
            value: new Hooks(),
            configurable: false
        });

        // why freeze the object?
        //return Object.freeze(this);

    };


    /**
     * Execute command
     * @param {String} _id MongoDB ObjectID as string (Command id)
     * @param {Array} params Command parameters 
     * @param {Function} cb Callback
     * @returns 
     */
    execute(_id, params, cb) {

        console.log("EXECUTE COMMAND!!!!!", _id)

        if (params instanceof Function && !cb) {
            cb = params;
            params = {};
        }

        let cmd = this.find((obj) => {
            return String(obj._id) === _id || obj.alias === _id;
        });

        if (!cmd) {
            cb(new Error(`Command "${_id}" not found`));
            return;
        }

        let { interfaces } = global.sharedObjects;
        let iface = interfaces.get(cmd.interface);

        //console.log(cmd.interface)

        if (!iface) {
            cb(new Error(`No interface for endpoint found`));
            return;
        }


        //console.log(interfaceStreams)

        if (this.handler.has(cmd._id)) {
            try {

                let handler = this.handler.get(cmd._id);

                // default timeout = 2s
                let finish = timeout(Number(process.env.COMMAND_RESPONSE_TIMEOUT), (timedout, duration, args) => {
                    if (timedout) {

                        cb(null, false);

                    } else {

                        cb(...args);

                    }
                });

                handler(cmd, iface, params).then((success) => {
                    finish(null, success);
                }).catch((err) => {
                    finish(err, false);
                });

            } catch (err) {

                // catch error in custom handler function
                // keep the process running
                cb(new Error(`Error in custom comand handler function: \r\n${err}`));

            }
        } else {

            // default timeout = 2s
            let finish = timeout(Number(process.env.COMMAND_RESPONSE_TIMEOUT), (timedout, duration, args) => {
                if (timedout) {
                    cb(null, false);
                } else {
                    cb(...args);
                }
            });


            if (!cmd.payload) {

                let msg = "Command payload not defined\r\n";
                msg += `Add payload to command or write a plugin that implement the command handling`;
                let err = new Error(msg);

                return finish(err, false);

            }


            // TODO implement/reqrite success/failure auswertung &timeout handling)
            iface.write(cmd.payload, (err) => {
                if (err) {

                    // pass write error
                    cb(err);

                } else {

                    // write was completed
                    // wait for device response
                    // default success check, payload = device response
                    // if payload != response 
                    // iface.once("readable") ?!
                    iface.once("data", (chunk) => {

                        // read chunk
                        //let chunk = iface.read();
                        let regex = new RegExp(/success|ok|1|true/, "gimu");

                        // compare respond with command payload
                        if (chunk && chunk === cmd.payload || regex.test(chunk)) {

                            finish(null, true);

                        } else {

                            // middleware/hooks?
                            // what would be another possible response?
                            // work with regex, like "OK_<payload>"?
                            finish(null, null);

                        }

                    });

                }
            });

        }

    };


    /**
     * Set custom command handler
     * @param {Array,Boolean,String} aliases Register <handler> for command/alias
     * @param {function} handler Function that handle the command execution
     * @param {function} cb Callback for errors/success
     */
    handle(aliases, handler, cb = () => { }) {

        if (aliases instanceof Array) {

            // everything is good
            // do nothing/contineu...

        } else if (aliases instanceof String) {

            aliases = [aliases];

        } else if (typeof (aliases) === "boolean" && aliases === true) {

            aliases = this.map(({ _id }) => {
                return _id;
            });

        } else {
            throw new Error(`Exptced Array/String/Boolean as alias, got "${typeof alias}"`);
        }


        aliases.forEach((alias) => {

            let target = this.find((cmd) => {
                return (cmd.alias === alias) || (cmd._id === alias);
            });

            if (!target && cb instanceof Function) {
                return cb(new Error(`Alias not defined for command: ${alias}`));
            }

            this.handler.set(target._id, handler);

        });

        cb(null);

    };

};