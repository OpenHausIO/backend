const Joi = require("joi");
const { Agent } = require("http");
const mongodb = require("mongodb");
const { Transform, Duplex } = require("stream");

/**
 * @description
 * Implements a interface item, that hides a duplex stream in it, to read/write data from a device interface
 * 
 * @class Interface
 * 
 * @param {Object} obj Object that matches the item schema. See properties below:
 * @param {InterfaceStream} stream Instance of a InterfaceStream object
 * 
 * @property {String} _id MongoDB Object id is as string
 * @property {String} type Type of the interface, `SERIAL` or `ETHERNET`
 * @property {Object} settings Interface specifiy type settings.
 * @property {Array} [adapter=["raw"]] Array of adapter to use for encoding/decoding data: `base64`, `eiscp`, `json`, `raw`
 * 
 * @see interfaceStream components/devices/class.interfaceStream.js
 * @link https://github.com/OpenHausIO/backend/blob/dev/components/devices/class.interface.js#L27
 * @link https://github.com/OpenHausIO/backend/blob/dev/components/devices/class.interface.js#L40
 */
module.exports = class Interface {

    constructor(obj, stream) {

        Object.assign(this, obj);
        this._id = String(obj._id);

        // hide stream object on interface
        Object.defineProperty(this, "stream", {
            value: stream
        });

        // share/set interface stream
        // see #86
        //let { interfaceStreams } = global.sharedObjects;
        let { interfaceStreams } = require("../../system/shared.js");
        interfaceStreams.set(this._id, stream);

        // hot fix for #350
        Object.defineProperty(this, "cachedAgent", {
            value: null,
            enumerable: false,
            configurable: false,
            writable: true
        });

    }

    /**
     * @function schema
     * Interface schema 
     * 
     * @static
     * 
     * @returns {Object} https://joi.dev/api/?v=17.6.0#anyvalidatevalue-options
     */
    static schema() {

        // settings from node.js serialport (https://serialport.io/docs/api-bindings-cpp#open)
        const SERIAL = Joi.object({
            device: Joi.string().required(),
            baudRate: Joi.number().default(9600),
            dataBits: Joi.number().allow(5, 6, 7, 8).default(8),
            stopBits: Joi.number().allow(1, 1.5, 2).default(1),
            parity: Joi.string().valid("even", "odd", "none").default("none"),
            rtscts: Joi.boolean().default(false),
            xon: Joi.boolean().default(false),
            xoff: Joi.boolean().default(false),
            xany: Joi.boolean().default(false),
            hupcl: Joi.boolean().default(true)
        }).required();

        const ETHERNET = Joi.object({
            //transport: Joi.string().valid("tcp", "udp", "raw").default("tcp"),
            socket: Joi.string().valid("tcp", "udp", "raw").default("tcp"),
            host: Joi.string().required(),
            port: Joi.number().min(1).max(65535).required(),
            // https://regex101.com/r/wF7Nfa/1
            // https://stackoverflow.com/a/50080404/5781499
            mac: Joi.string().default(null).allow(null).regex(/^([0-9a-fA-F]{2}[:]){5}[0-9a-fA-F]{2}$/)
        }).required();

        return Joi.object({
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return String(new mongodb.ObjectId());
            }),
            type: Joi.string().default("ETHERNET"),
            settings: Joi.object().when("type", {
                is: "ETHERNET",
                then: ETHERNET
            }).when("type", {
                is: "SERIAL",
                then: SERIAL
            }),
            adapter: Joi.array().items("eiscp", "raw", "eol").default(["raw"]),
            description: Joi.string().allow(null).default(null)
        });

    }


    /**
     * @function httpAgent
     * Creates a custom http agent which use the underalying interfaceStream to forward data
     * 
     * @param {Object} [options] httpAgent options 
     * 
     * @returns {Object} httpAgent object
     * 
     * @link https://nodejs.org/dist/latest-v16.x/docs/api/http.html#new-agentoptions 
     */
    /*
    // *OLD* function, see #329
    httpAgent(options) {

        options = Object.assign({
            keepAlive: true,
            //maxSockets: 1,
            keepAliveMsecs: 3000,        // use this as websocket ping/pong value to detect broken connections?
        }, options);

        // stream nc tcp socket 
        // https://stackoverflow.com/a/33514724/5781499
        let agent = new Agent(options);

        // use interface stream as socket
        // createConnection returns duplex stream
        // https://nodejs.org/dist/latest-v14.x/docs/api/http.html#http_agent_createconnection_options_callback
        agent.createConnection = (options, cb) => {

            let input = new PassThrough();
            let output = new PassThrough();


            this.stream.pipe(input, { end: false });
            output.pipe(this.stream, { end: false });


            let socket = Duplex.from({
                readable: input,
                writable: output
            });

            // when multiple reuqests are done parallal, sometimes a AbortedErr is thrown
            // see #329 for details
            // TODO: Check if the upstream is drained, and perform requests in series
            // As "quick fix" till a solution is found for #312 catch the trown error
            socket.on("error", (err) => {
                console.log("Catched error on http.agent.createConnection", err);
                this.stream.destroy();
            });

            /*
                        [socket, this.stream, input, output].forEach((stream) => {
                            let cleanup = finished(stream, (err) => {
            
                                console.log("Socket duplex stream ended", err);
            
                                let chunk;
            
                                while (null !== (chunk = input.read())) {
                                    console.log(`>>>>>> Read ${chunk.length} bytes of data...`);
                                }
            
                                while (null !== (chunk = output.read())) {
                                    console.log(`>>>>>> Read ${chunk.length} bytes of data...`);
                                }
            
                                input.removeAllListeners();
                                output.removeAllListeners();
            
                                this.stream.unpipe(input);
                                output.unpipe(this.stream);
            
                                cleanup();
            
                            });
                        });
            *


            // TODO implement other socket functions?!
            //if (process.env.NODE_ENV !== "production") {
            socket.ref = (...args) => { console.log("socket.ref called", ...args); };
            socket.unref = (...args) => { console.log("socket.unref called", ...args); };
            socket.setKeepAlive = (...args) => { console.log("socket.setKeepAlive called", ...args); };
            socket.setTimeout = (...args) => { console.log("socket.setTimeout called", ...args); };
            socket.setNoDelay = (...args) => { console.log("socket.setNoDelay called", ...args); };
            // socket.remoteAddress=this.settings.host
            // socket.remotePort=this.settings.port
            //}

            //return socket;
            cb(null, socket);

        };

        return agent;

    }
    */


    // NEW VERSION, fix for #329
    httpAgent(options = {}) {

        if (this.cachedAgent) {
            return this.cachedAgent;
        }

        let agent = new Agent({
            keepAlive: true,
            maxSockets: 1,
            ...options
        });

        //let settings = this.settings;

        /*
        // added for testing a solution for #411
        // does nothing/not work, but feels like can be useful in the future
        // see: 
        // - https://nodejs.org/docs/latest/api/http.html#agentkeepsocketalivesocket
        // - https://nodejs.org/docs/latest/api/http.html#agentkeepsocketalivesocket
        agent.keepSocketAlive = (socket) => {
            console.log("agent.keepSocketAlive called");
            return true;
        };

        agent.reuseSocket = (socket, request) => {
            console.log("agent.reuseSocket called");
        };
        */

        agent.createConnection = ({ headers = {} }) => {

            //console.log(`############## Create connection to tcp://${host}:${port}`);

            // cleanup, could be possible be piped from previous "connections"
            this.stream.unpipe();

            /*
            // check if passed host/port matches interface settings?
            if (host != settings.host || port != settings.port) {

                let msg = "host/port for interface missmatch, expected:\r\n";
                msg += `\thost = ${host}; got = ${settings.host}\r\n`;
                msg += `\tport = ${settings.port}; got = ${settings.port}`;

                throw new Error(msg);

            }
            */

            //let readable = new PassThrough();
            //let writable = new PassThrough();

            // convert headers key/values to lowercase
            // the string conversion prevents a error thrown for numbers
            // this happens for websocket requests, where e.g. "sec-websocket-version=13"
            // see snipp below "detect websocket connection with set headers"
            headers = Object.keys(headers).reduce((obj, key) => {
                obj[key.toLowerCase()] = `${headers[key]}`.toLowerCase();
                return obj;
            }, {});


            let readable = new Transform({
                transform(chunk, enc, cb) {

                    //console.log("[incoming]", chunk);

                    // temp fix for #343
                    // this is not the prefered fix for this issue
                    // it should be handled on "stream/socket" level instead
                    // the issue above occoured with a "shelly 1pm" and parallel requests to /status /ota /settings
                    // NOTE: what if the body contains json that has a `connection: close` property/key/value?

                    // detect websocket connection with set headers, fix #411
                    // agent.protocol is never "ws" regardless of the url used in requests
                    // temp solution, more like a hotfix than a final solution
                    if (agent.protocol === "http:" && !(headers?.upgrade === "websocket" && headers?.connection === "upgrade")) {
                        chunk = chunk.toString().replace(/connection:\s?close\r\n/i, "connection: keep-alive\r\n");
                    }

                    this.push(chunk);
                    cb();

                }
            });

            let writable = new Transform({
                transform(chunk, enc, cb) {

                    //console.log("[outgoing]", chunk);

                    this.push(chunk);
                    cb();

                }
            });


            // TODO Implement "auto-drain" when no upstream is attached -> Move this "lower", e.g. before ws upstream?
            /*
            let writable = new Transform({
                transform(chunk, enc, cb) {

                    debugger;

                    //console.log("this.stream",);
                    console.error(">>>> Write data, flowing?", str.upstream ? true : false, settings.host);

                    if (str.upstream) {
                        this.push(chunk);
                    } else {
                        while (this.read() !== null) {
                            // do nothing with writen input data
                            // empty readable queue
                        }
                    }

                    cb();

                }
            });
            */


            let stream = new Duplex.from({
                readable,
                writable
            });

            stream.destroy = () => {
                //console.log("socket.destroy();", args);
            };

            stream.ref = () => {
                //console.log("socket.unref();", args);
            };

            stream.unref = () => {
                //console.log("socket.unref();", args);
            };

            stream.setKeepAlive = () => {
                //console.log("socket.setKeepAlive()", args);
            };

            stream.setTimeout = () => {
                //console.log("socket.setTimeout();", args);
            };

            stream.setNoDelay = () => {
                //console.log("socket.setNotDelay();", args);
            };

            this.stream.pipe(readable, { end: false });
            writable.pipe(this.stream, { end: false });

            return stream;

        };

        this.cachedAgent = agent;
        return agent;

    }



};