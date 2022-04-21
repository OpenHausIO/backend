//const { DuplexWrapper } = require("duplexer3");
const { PassThrough } = require("stream");
const { Duplex } = require("stream");

// see: https://github.com/OpenHausIO/backend/issues/64
//module.exports = class Adapter extends DuplexWrapper {

/**
 * @description
 * Create a encode/decode data flow with adapters
 * 
 * @class Adapter 
 * @extends Duplex https://nodejs.org/dist/latest-v16.x/docs/api/stream.html#class-streamduplex
 * 
 * @param {Array} stack Gute frage....
 * @param {Object} upstream Upstream socket connecto to device (WebSocket)
 * @param {Object} options Duplex stream options
 */
module.exports = class Adapter extends Duplex.from {
    constructor(stack, upstream, options) {

        options = Object.assign({
            emitClose: false,       // false
            decodeStrings: false,    // false
            encoding: "utf8",
            objectMode: false    // true
        }, options);


        let read = new PassThrough(options);
        let write = new PassThrough(options);


        super({
            readable: read,
            writable: write
        });


        let encode = stack.map(({ encode }) => {
            return encode;
        });

        let decode = stack.map(({ decode }) => {
            return decode;
        });



        // build encode flow
        encode.reduce((prev, cur) => {

            prev.on("error", (err) => {

                console.log("Error on stream (encode)", err);

                //this.destory();                
                //this.close();
                upstream.end();

            });

            cur.once("close", () => {
                console.log("Encode closed");
            });

            return prev.pipe(cur, { end: false });

        }, write).pipe(upstream);

        // build decode flow
        // stack.reverse()
        decode.reduceRight((prev, cur) => {

            prev.on("error", (err) => {

                console.log("Error on stream (decode)", err);

                //this.destory();
                //this.close();
                upstream.end();

            });

            cur.once("close", () => {
                console.log("Decode closed");
            });

            return prev.pipe(cur, { end: false });

        }, upstream).pipe(read);


    }
};