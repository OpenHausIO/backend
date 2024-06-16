const { EOL } = require("os");
const util = require("util");

const { Transform } = require("stream");
//const exporter = new PassThrough();
const exporter = new Transform({
    transform(chunk, encoding, cb) {

        // ignore & drop every message if no pipe/consumer. Otherwise this jams up the stream
        // TODO: check with this.listenerCount('data'|'readable')?
        if (this._readableState.pipes.length > 0 || this._events.data instanceof Function) {
            this.push(chunk);
        }

        //cb();
        process.nextTick(cb);

    }
});

const levels = require("./levels");

/**
 * @description
 * Logger class which create a custom logger object
 * 
 * @class Logger
 * 
 * @param {Object} options Options object
 * @param {String} options.level Logging level: `error`, `warn`, `info`, `debug`, `verbose`, `trace`
 * @param {String} options.name Logger name that is shown in messages
 * @param {Array} options.streams Array of streams where to write data
 */
module.exports = class Logger {

    constructor(options) {

        options = Object.assign({
            level: "trace",
            streams: [],
            name: "default"
        }, options);

        // "expose" options
        this.options = options;

        // monkey patch methods defined in levels
        for (const [method, value] of Object.entries(levels.names)) {
            this[method] = (...args) => {

                // if LOG_TARGET is set, ignore everything that does not match the logger name
                if (process.env.LOG_TARGET !== "" && process.env.LOG_TARGET !== options.name && options.name !== "system") {
                    return;
                }

                if (process.env.LOG_SUPPRESS === "true") {
                    return;
                }

                if (value >= levels.names[options.level]) {

                    let obj = {
                        level: method,
                        name: options.name,
                        timestamp: Date.now(),
                        message: null,
                        fields: [],
                        error: null
                    };

                    if (args[0] instanceof Error) {

                        let err = args.shift();

                        // NOTE: `Object.getOwnPropertyNames(err)` makes no sense here
                        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
                        obj.error = JSON.stringify(err, Object.getOwnPropertyNames(err));
                        obj.message = util.format(...args);

                        //obj.fields = args;

                    } else {

                        // fix #331
                        // NOTE: here could be a level specific options
                        // e.g. for "verbose", set "showProxy" or "getters"
                        // https://nodejs.org/docs/latest/api/util.html#utilinspectobject-showhidden-depth-colors
                        // optinal configurable with environment variable like "LOGGER_INSPECT_OPTIONS" or so...
                        /*
                        args = args.map((arg) => {
                            //return JSON.stringify(arg, null, 2);
                            return util.inspect(arg, {
                                depth: null,
                                colors: true,
                            });
                        });
                        */

                        //obj.message = args.shift();
                        obj.message = util.format(...args);
                        //obj.fields = args;

                    }

                    let record = JSON.stringify(obj) + EOL;

                    options.streams.forEach((stream) => {
                        stream.write(record);
                    });

                }

            };
        }

    }

    /**
     * @function tracer
     * Provides a logger that decrements a counter, which can be used to illustrate a function flow
     * 
     * @param {String} desc Description of the thing you want to "trace"
     * @param {Number} count How many client calls till "Finished!" is logged?
     * @param {Function} cb Callback which returns a custom "finish" message
     * 
     * @example
     * ```js
     * const Logger = require(".../system/logger/class.logger.js");
     * const logger = new Logger({
     *   streams: [
     *     process.stdout
     *   ]
     * });
     * 
     * const tracer = logger.tracer("Called 3 times", 3, () => {
     *   console.log(".tracer has called 3 times");
     *   return "Yeah! You got it, its done.";
     * });
     * 
     * tracer("Foo");
     * tracer("Bar");
     * tracer("Baz");
     * ```
     * 
     * @returns {Function} Wrapped logger function
     */
    tracer(desc, count, cb = () => "Finished!", level = "trace") {

        let counter = 0;
        let fired = false;

        return (...args) => {
            if (!fired) {

                counter += 1;

                this[level](`${desc}; ${counter}/${count}; ${util.format(...args)}`);

                if (counter >= count && !fired) {
                    this.trace(cb());
                    fired = true;
                }

            } else {

                this.warn(`${desc}; Called more than ${count} times!`);

            }
        };

    }

    static exporter() {
        return exporter;
    }

};