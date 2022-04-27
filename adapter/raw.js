const { Transform } = require("stream");

const logger = require("../system/logger");
const log = logger.create("adapter/raw");

module.exports = (options = {}) => {

    let encode = new Transform({
        transform(chunk, encoding, cb) {

            log.trace("[encode]", chunk);
            cb(null, chunk);

        },
        ...options
    });

    let decode = new Transform({
        transform(chunk, encoding, cb) {

            log.trace("[decode]", chunk);
            cb(null, chunk);

        },
        ...options
    });

    return {
        encode,
        decode
    };

};