const { Transform } = require("stream");
const logger = require("../system/logger").create("adapter/base64");

module.exports = (options) => {

    const encode = new Transform({
        transform(chunk, encoding, cb) {

            let data = chunk.toString("base64");

            logger.verbose("[encode]: %j", data);

            this.push(data);

            cb();

        },
        ...options
    });

    const decode = new Transform({
        transform(chunk, encoding, cb) {

            let data = Buffer.from(chunk.toString(), "base64").toString("ascii");

            logger.verbose("[decode]: %j", data);

            this.push(data);

            cb();

        },
        ...options
    });

    return {
        encode,
        decode
    };

};