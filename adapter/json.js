const { Transform } = require("stream");
const logger = require("../system/logger").create("adapter/json");

module.exports = (options) => {

    const encode = new Transform({
        transform(chunk, encoding, cb) {

            let data = JSON.stringify(chunk);

            logger.verbose("[encode] %d", data);

            this.push(data);

            cb();

        },
        ...options
    });

    const decode = new Transform({
        transform(chunk, encoding, cb) {

            let data = JSON.parse(chunk);

            logger.verbose("[decode] %d", data);

            this.push(data)

            cb();

        },
        ...options

    });

    return {
        encode,
        decode
    }

};