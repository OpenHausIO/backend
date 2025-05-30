//const { createInterface } = require("readline");
const { Transform } = require("stream");

module.exports = (id) => {
    return new Transform({
        transform(chunk, enc, cb) {

            this.push(`[#${id}]` + chunk);
            cb(null);

        }
    });
};