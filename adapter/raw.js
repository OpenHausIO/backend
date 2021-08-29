const { Transform } = require("stream");
const util = require("util");
const logger = require("../system/logger").create("adapter/raw");

module.exports = (options = {}) => {

    let encode = new Transform({
        transform(chunk, encoding, cb) {

            //logger.verbose("adapter.raw() | encode")
            //console.log("raw encode", chunk)

            //debugger;

            //console.log(chunk.toString(), encoding)

            cb(null, chunk);

            //debugger;

        },
        ...options
    });

    let decode = new Transform({
        transform(chunk, encoding, cb) {

            //logger.verbose("adapter.raw() | decode")
            //console.log("raw decode", chunk.toString())

            //debugger;

            //console.log(chunk, encoding)

            cb(null, chunk);

            //debugger;

        },
        ...options
    });

    return {
        encode,
        decode
    };

};