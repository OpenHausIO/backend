const path = require("path");
const { Duplex, finished } = require("stream");

const { interfaceStreams } = require("../../system/shared.js");

const timeout = require("../../helper/timeout");
const Adapter = require("./class.adapter.js");
const kSource = Symbol("source");

// https://www.programmersought.com/article/42661306247/
// https://www.freecodecamp.org/news/node-js-streams-everything-you-need-to-know-c9141306be93/
// https://livebook.manning.com/book/node-js-in-practice/chapter-5/37
// https://pastebin.com/H0CQdQdZ

/**
 * @description
 * Handle the Stream implementation for Interfaces
 * 
 * @class InterfaceStream
 * @extends Duplex https://nodejs.org/dist/latest-v16.x/docs/api/stream.html#class-streamduplex
 *  
 * @property {Object} [options={}] Duplex stream options
 * @property {Array} [adapter=["raw"]] Adapter to use for encoding/decoding data
 */
module.exports = class InterfaceStream extends Duplex {

    // not called, because mixins/prroxy?
    /*
    // strange behavor, 
    static [Symbol.hasInstance](obj) {
        //console.log(obj)
        return true;
    }*/

    constructor(options, adapter = ["raw"]) {

        if (options instanceof Array && !adapter) {
            adapter = options;
            options = {};
        }


        // NOTE: WRONG OPTIONS HERE CRASH NODEJS
        // encoding = "utf8" break things
        options = Object.assign({
            emitClose: false,
            //decodeStrings: false,
            //encoding: "utf8",
            //objectMode: true
            end: false
        }, options);

        super(options);

        this.adapter = adapter;
        this.upstream = null;

    }

    _reEmit(events) {
        events.forEach((event) => {
            this.upstream.on(event, (...args) => {
                this.emit(event, ...args);
            });
        });
    }


    _write(chunk, encoding, cb) {
        if (this.upstream /*&& this.upstream.writableEnded*/) {

            this.upstream.write(chunk, encoding, (err) => {
                cb(err);
            });

        } else {

            console.log("write to upstream not possible");

        }
    }

    _read() {
        if (this.upstream /*&& !this.upstream.readableEnded*/) {

            // WORKFLOW:
            // - in this.push() schieben
            // - bis this.push false zurück gibt

            /*
                        // https://nodejs.org/dist/latest-v14.x/docs/api/stream.html#stream_readable_read_size
                        let chunk = null;
            
                        while (null !== (chunk = this.upstream.read(size))) {
                            console.log(`Read ${chunk.length} bytes of data...`);
                            this.push(chunk)
                        }
            */

            this.upstream.once("readable", () => {

                // start reading
                let more = true;


                while (more) {

                    // read from upstream
                    let chunk = this.upstream.read();

                    if (chunk) {

                        // push in qeueue
                        more = this.push(chunk);

                    } else {

                        // stop reading
                        more = false;

                    }
                }

            });

        } else {

            console.log("Read from upstream not possible");

        }
    }


    _close() {
        console.log("_close called");
    }


    close() {
        console.log("close called");
    }




    _end() {
        console.log("_end called");
    }


    end() {
        console.log("end called");
    }



    attach(stream, cb) {

        let stack = this.adapter.map((name) => {
            try {

                return require(path.resolve(process.cwd(), "adapter", `${name}.js`))();

            } catch (err) {

                console.error(`Error in adapter "${name}" `, err);

            }
        });

        let cleanup = finished(stream, {
            //error: true,
            //readable: true,
            //writable: true
        }, (err) => {

            cleanup();

            console.log("Upstream is usless, detach!", err);

            this.detach((existed) => {
                console.log("upstream has been detached! was set?", existed);
            });

            if (process.env.NODE_ENV === "development") {
                //process.exit(1);
            }

        });

        let upstream = new Adapter(stack, stream, {
            // duplex stream options
            emitClose: false,
            end: false
        });

        finished(upstream, (err) => {

            console.log("Adapter upstream crashed", err);

        });

        this.upstream = upstream;
        this[kSource] = upstream;




        // ignore or re-throw?!
        stream.on("end", () => {
            console.log("End on upstream emitted");
            //this.emit("end");
            this.detach();
        });


        // Why is this commented?! and not active
        // readable events we want to re-emit
        //this._reEmit(["data", "readable"]);

        // writabel events we waant to re-emit
        this._reEmit(["drain", "finish", "pipe", "unpipe"]);

        if (cb) {
            cb(null);
        }

        this.emit("attached", upstream);

    }


    detach(cb = () => { }) {

        /*
        // USE THIS?!
        Promise.all([
            new Promise((resolve) => {

                // terminate wrtiable on upstream
                this.upstream.once("close", resolve)
                this.upstream.end();

            }),
            new Promise(() => {


                // terminate readable on upstream
                this.upstream.once("end", resolve);
                this.upstream.destroy();

            })
        ]).then(() => {

            // callback & emit detacehd

        });
        */

        if (!this.upstream) {

            process.nextTick(() => {
                cb(false);
            });

            return;

        }

        let trigger = timeout(2000, () => {

            if (cb) {
                cb(true);
            }

            this.upstream = null;
            this[kSource] = null;

            this.emit("detached");

        });

        this.upstream.once("close", trigger);
        //this.once("end", trigger);

        // end writable upstream
        this.upstream.end();

        // destroy readable stream
        this.upstream.destroy();

        // delete upstream from map
        interfaceStreams.delete(this._id);

    }

};