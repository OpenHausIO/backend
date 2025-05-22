const { Duplex } = require("stream");

module.exports = class MessagePortStream extends Duplex {

    constructor(port) {
        super({ objectMode: true });
        this.port = port;

        this.port.on("message", (msg) => {
            this.push(msg);
        });

        this.port.on("close", () => {
            this.push(null);
        });
    }

    _read() {
        // not used, handled via .push() above
    }

    _write(chunk, encoding, callback) {
        this.port.postMessage(chunk);
        callback();
    }

    _final(callback) {
        this.port.close();
        callback();
    }

};