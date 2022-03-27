const process = require("process");
const events = require("events");

const Hooks = require("../hooks.js");


module.exports = class BASE {

    constructor() {
        this.ready = false;
        this.events = new events();
        this.hooks = new Hooks();
    }

    // NOTE improve/change function name
    // impement in child class "_init" and call that?
    // like stream implementaiton "_write" / "_read"?
    // https://nodejs.org/dist/latest-v14.x/docs/api/stream.html#stream_writable_write_chunk_encoding_callback_1
    init(cb) {
        cb(this, (err) => {
            if (err) {

                // see issue #53, this should not throw
                this.events.emit("error", err);
                //process.exit(1000); ?!

            } else {

                this.ready = true;

                process.nextTick(() => {
                    this.events.emit("ready");
                });

            }
        });
    }

};