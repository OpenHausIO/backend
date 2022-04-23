const path = require("path");
const { Writable } = require("stream");
const { createWriteStream } = require("fs");
const { EOL } = require("os");


const Logger = require("./class.logger.js");
const formatter = require("./formatter.js");

/**
 * @description 
 * This is the main logger instance.<br />
 * A `.create` function is monkey patched to it.
 * 
 * @example
 * ```js
Object.defineProperty(logger, "create", {
    value: function create(name) {

        let file = path.resolve(process.env.LOG_PATH, `${name}.log`);
        let stream = createWriteStream(file);

        stream.on("error", (err) => {
            console.error(err);
            process.exit(1);
        });

        let opts = Object.assign({}, options, {
            name,
            streams: [
                stdout,
                stream
            ]
        });

        return new Logger(opts);

    },
    writable: false,
    configurable: false,
    enumerable: false
});
 * ```
 * 
 * @example
 * ```js
 * const logger = require(".../logger");
 * 
 * const log = logger.create("Hello World");
 * log.info("Info message");
 * ```
 */

const file = path.resolve(process.env.LOG_PATH, "system.log");
const stream = createWriteStream(file);

stream.on("error", (err) => {
    console.error(err);
    process.exit(1);
});


const stdout = new Writable({
    write: (chunk, encoding, cb) => {

        chunk = JSON.parse(chunk);
        chunk.message = formatter(chunk);

        //console.log(chunk.message);
        process.stdout.write(chunk.message + EOL);

        if (chunk.error) {
            console.log(JSON.parse(chunk.error).stack + EOL);
        }

        cb(null);

    }
});


const options = {
    name: "system",
    streams: [
        stdout,
        stream,
    ],
    level: process.env.LOG_LEVEL
};


const logger = new Logger(options);


Object.defineProperty(logger, "create", {
    value: function create(name) {

        let file = path.resolve(process.env.LOG_PATH, `${name}.log`);
        let stream = createWriteStream(file);

        stream.on("error", (err) => {
            console.error(err);
            process.exit(1);
        });

        let opts = Object.assign({}, options, {
            name,
            streams: [
                stdout,
                stream
            ]
        });

        return new Logger(opts);

    },
    writable: false,
    configurable: false,
    enumerable: false
});


module.exports = logger;