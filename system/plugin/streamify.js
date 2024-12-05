const { Duplex } = require("stream");
const { Worker, MessageChannel } = require("worker_threads");

class Streamify extends Duplex {
    constructor(worker, name = null) {
        super();

        // Initialisierung
        this.messageQueue = [];
        this.onMessage = null;

        // Port wird erstellt
        this.port = Streamify.createChannel(worker, name);

        // Nachrichten vom Port abfangen
        this.port.on("message", (data) => {
            if (this.onMessage) {
                this.onMessage(data);
                this.onMessage = null;
            } else {
                this.messageQueue.push(data);
            }
        });
    }

    _read() {
        if (this.messageQueue.length > 0) {
            this.push(this.messageQueue.shift());
        } else {
            this.onMessage = (data) => this.push(data);
        }
    }

    _write(chunk, enc, cb) {
        this.port.postMessage(chunk.toString());
        cb();
    }

    _final(cb) {
        this.port.postMessage(null);
        cb();
    }

    static createChannel(worker, name) {

        const { port1, port2 } = new MessageChannel();

        worker.postMessage({
            action: "newChannel",
            name,
        }, [port2]);

        return port1;

    }

}

// Beispielnutzung

const worker = new Worker("./worker.js");

// Erstellen eines Streams
const stream1 = new Streamify(worker, "channel1");
stream1.write("Hello from main on channel1!");
stream1.on("data", (data) => {
    console.log(`Main received on channel1: ${data}`);
});

const stream2 = new Streamify(worker, "channel2");
stream2.write("Hello from main on channel2!");
stream2.on("data", (data) => {
    console.log(`Main received on channel2: ${data}`);
});
