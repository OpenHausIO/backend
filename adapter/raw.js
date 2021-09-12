const { Transform } = require("stream");

module.exports = (options = {}) => {

    let encode = new Transform({
        transform(chunk, encoding, cb) {

            cb(null, chunk);

        },
        ...options
    });

    let decode = new Transform({
        transform(chunk, encoding, cb) {

            cb(null, chunk);

        },
        ...options
    });

    return {
        encode,
        decode
    };

};