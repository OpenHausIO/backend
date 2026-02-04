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

/*
module.exports = (id) => {

    let lastLinePartial = "";

    return new Transform({
        transform(chunk, enc, cb) {

            const lines = (lastLinePartial + chunk.toString()).split(/\r?\n/);
            lastLinePartial = lines.pop();

            lines.forEach(line => {
                this.push(`[#${id}]${line}\n`);
            });

            cb();

        },
        flush(cb) {

            if (lastLinePartial) {
                this.push(`[#${id}]${lastLinePartial}\n`);
            }

            cb();

        }
    });
};
*/