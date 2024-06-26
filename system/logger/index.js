const path = require("path");
const { Writable } = require("stream");
const { createWriteStream, existsSync, mkdirSync } = require("fs");
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
        let stream = createWriteStream(file, {
            flags: "a"
        });

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

const system = createWriteStream(path.resolve(process.env.LOG_PATH, "system.log"), {
    flags: "a"
});
const combined = createWriteStream(path.resolve(process.env.LOG_PATH, "combined.log"), {
    flags: "a"
});

const exporter = Logger.exporter();


[system, combined, exporter].forEach((stream) => {
    stream.on("error", (err) => {
        console.error(err);
        process.exit(1);
    });
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
        system,
        combined,
        exporter
    ],
    level: process.env.LOG_LEVEL
};


const logger = new Logger(options);


Object.defineProperty(logger, "create", {
    value: function create(name) {

        let file = path.resolve(process.env.LOG_PATH, `${name}.log`);

        if (!existsSync(path.dirname(file))) {
            mkdirSync(path.dirname(file), {
                recursiv: true
            });
        }

        let stream = createWriteStream(file, {
            flags: "a"
        });

        stream.on("error", (err) => {
            console.error(err);
            process.exit(1);
        });

        let opts = Object.assign({}, options, {
            name,
            streams: [
                stdout,
                stream,
                combined,
                exporter
            ]
        });

        return new Logger(opts);

    },
    writable: false,
    configurable: false,
    enumerable: false
});


if (process.env.LOG_TARGET) {
    logger.warn(`Log target set to "${process.env.LOG_TARGET}"`);
}


module.exports = logger;