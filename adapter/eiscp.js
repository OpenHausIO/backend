const { Transform } = require("stream");

const logger = require("../system/logger");
const log = logger.create("adapter/eiscp");


module.exports = (options) => {

    //logger.verbose("options object: %j", options);

    // encode stream
    const encode = new Transform({
        transform: (data, encoding, cb) => {

            // feedback
            log.trace("[encode] (%s) %j", encoding, data);

            // Add ISCP header if not already present
            if (data.charAt(0) !== "!") {
                data = `!1${data}`;
            }

            // ISCP message
            const iscp_msg = Buffer.from(`${data}\x0D\x0a`);

            // eISCP header
            const header = Buffer.from([
                73, 83, 67, 80,             // magic
                0, 0, 0, 16,                // header size
                0, 0, 0, 0,                 // data size
                1,                          // version
                0, 0, 0                     // reserved
            ]);

            // write data size to eISCP header
            header.writeUInt32BE(iscp_msg.length, 8);
            cb(null, Buffer.concat([header, iscp_msg]));

        },
        ...options,
        encoding: "utf8",
        objectMode: true
    });


    // decode stream
    const decode = new Transform({
        transform: (data, encoding, cb) => {

            let payload = data.toString("ascii", 18, data.length - 3);

            // feedback
            log.trace("[decode] %j", payload);

            //data = String(data);
            cb(null, payload);

        },
        ...options,
        encoding: "utf8",
        objectMode: true
    });


    return {
        encode,
        decode
    };

};