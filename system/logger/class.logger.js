const { EOL } = require("os");
const util = require("util");

const levels = require("./levels");

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
                if (process.env.LOG_TARGET !== "" && process.env.LOG_TARGET !== options.name) {
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

                        obj.error = JSON.stringify(err, Object.getOwnPropertyNames(err));
                        obj.message = util.format(...args);

                        //obj.fields = args;

                    } else {

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

    tracer(desc, count, cb = () => "Finished!") {

        let counter = 0;
        let fired = false;

        return (msg) => {
            if (!fired) {

                counter += 1;

                this.trace(`${desc}; ${counter}/${count}; ${msg}`);

                if (counter >= count && !fired) {
                    this.trace(cb());
                    fired = true;
                }

            } else {

                this.warn(`${desc}; Called more than ${count} times!`);

            }
        };

    }

};