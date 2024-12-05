const { Transform } = require("stream");


module.exports = function stdio(name, options) {
    return new Transform({
        transform(chunk, enc, cb) {

            this.push(`${name} ${chunk}`);

            cb();

        },
        ...options
    });
};