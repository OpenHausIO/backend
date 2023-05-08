const { Transform } = require("stream");

const logger = require("../system/logger");
const log = logger.create("adapter/eol");

module.exports = (options = {}) => {

    // https://github.com/OpenHausIO/backend/issues/315
    let cr = Buffer.from("\r");
    let lf = Buffer.from("\n");
    //let eol = Buffer.from("\x1A");
    let nl = Buffer.concat([
        cr,
        lf
    ]);

    let encode = new Transform({
        transform(chunk, encoding, cb) {
            log.trace("[encode] (%s) %j", encoding, chunk);
            cb(null, Buffer.concat([chunk, nl]));
        },
        ...options
    });

    let decode = new Transform({
        transform(chunk, encoding, cb) {
            log.trace("[encode] (%s) %j", encoding, chunk);
            // NOTE (mstirner) is this right?
            cb(null, chunk.subarray(0, nl.length));
        },
        ...options
    });

    return {
        encode,
        decode
    };

};