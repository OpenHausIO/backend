const { DuplexWrapper } = require("duplexer3");
const { PassThrough } = require("stream");

module.exports = class Adapter extends DuplexWrapper {
    constructor(stack, upstream, options) {

        options = Object.assign({
            emitClose: false,       // false
            decodeStrings: false,    // false
            encoding: "utf8",
            objectMode: false    // true
        }, options);


        let read = new PassThrough(options);
        let write = new PassThrough(options);
        super(options, write, read);


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