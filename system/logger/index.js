const path = require("path");
const winston = require("winston");
const safe = require("colors/safe");
const dateFormat = require("dateformat");
const { createLogger, format, transports } = winston;


// NOTE use https://www.npmjs.com/package/triple-beam?
//TODO: https://github.com/winstonjs/winston#working-with-multiple-loggers-in-winston

// TODO: Add logger.tracer method
// Create "sub" logger, with custom format.

const LOGGER_LEVELS = {
    levels: {
        error: 0,
        warn: 1,
        notice: 2,
        info: 3,
        debug: 4,
        verbose: 5
    },
    colors: {
        error: "red",
        warn: "yellow",
        notice: "magenta",
        info: "blue",
        debug: "gray",
        verbose: "cyan"
    }
};

function overrideLog(log, logger) {
    return (level, msg, ...args) => {
        if (msg instanceof Error) {

            log.apply(logger, [level, ...args, {
                error: msg.stack || msg
            }]);

        } else {

            log.apply(logger, [level, msg, ...args]);

        }
    };
}

const consoleFormat = winston.format((info, opts = {}) => {

    opts = Object.assign({
        attachErrorToMessage: true,
        name: "system"
    }, opts);

    let { message } = info;

    // prevent to log empty "message" or undefined
    if (!message && info.error) {
        message = info.error.message || "Error passed as Argument";
    }

    let colorize = safe[LOGGER_LEVELS.colors[info.level]];
    let timestamp = dateFormat(info.timestamp, "yyyy.mm.dd - HH:MM.ss.l");


    // build message string
    info.message = `[${colorize(timestamp)}]`;
    info.message += `[${colorize(info.level)}]`;
    info.message += `[${colorize(opts.name)}]`;
    info.message += ` ${message}`;


    // attach error stack to message?
    if (info.error && opts.attachErrorToMessage) {
        info.message += `\r\n${info.error}`;
    }

    // hack to avoid "format.simple()" or such shit
    info[Symbol.for("message")] = info.message;

    return info;

});




const GLOBAL_OPTIONS = {
    levels: LOGGER_LEVELS.levels,
    level: process.env.LOG_LEVEL || "verbose",
    format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.splat(),
        format.json(),
        //format.simple()
    ),
    transports: [
        new winston.transports.File({
            format: format.json(),
            filename: path.resolve(process.env.LOG_PATH, `system.log`)
        })
    ]
};



const logger = createLogger(GLOBAL_OPTIONS);
logger.log = overrideLog(logger.log, logger);







if (process.env.NODE_ENV !== "production") {

    let transport = new transports.Console({
        format: consoleFormat()
    });

    logger.add(transport);

}



logger.create = (name, options) => {

    options = Object.assign({
        //child logger options
        // winston logger options
    }, GLOBAL_OPTIONS, options);


    if (process.env.LOG_TARGET) {
        if (process.env.LOG_TARGET == name) {
            options.silent = false;
        }
    } else {
        options.silent = false;
    }

    // allways log system messages
    if (process.env.LOG_TARGET && RegExp("system*").test(name)) {
        options.silent = false;
    }

    /*
    if (name != "endpoints") {
        options.silent = true;
    } else {
        options.silent = false;
    }

    console.log(options.silent, name)
*/

    // supress all logger messages
    // eg for unit tests
    // NOTE remove/mute only console messages ?
    if (process.env.LOG_SUPPRESS === "true") {
        console.error("WARNING: SUPPRESSING ALL LOGGER MESSAGES!!!");
        options.silent = true;
    }


    let child = winston.loggers.add(name, options);
    child.log = overrideLog(child.log, child);

    if (process.env.NODE_ENV !== "production") {

        let transport = new transports.Console({
            format: consoleFormat({ name })
        });

        child.add(transport);

    }

    return child;

};



module.exports = logger;