const Joi = require("joi");
const { Agent } = require("http");
const https = require("https");
const tls = require("tls");
const mongodb = require("mongodb");
const { Duplex, PassThrough } = require("stream");
const { randomUUID } = require("crypto");
//const path = require("path");
const { EventEmitter } = require("events");

//const Adapter = require("./class.adapter.js");


const timeout = require("../../helper/timeout.js");
const promisfy = require("../../helper/promisify.js");

const PENDING_BRIDGES = new Set();
const WEBSOCKET_SERVER = new Map();
const LISTEN_INTERFACES = new Set();

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

    constructor(obj/*, stream*/) {

        Object.assign(this, obj);
        this._id = String(obj._id);

        /*
        // hide stream object on interface
        Object.defineProperty(this, "stream", {
            value: stream
            //value: new InterfaceStream(this)
        });

        // share/set interface stream
        // see #86
        //let { interfaceStreams } = global.sharedObjects;
        let { interfaceStreams } = require("../../system/shared.js");
        interfaceStreams.set(this._id, stream);
        */

        // hot fix for #350
        /*
        Object.defineProperty(this, "cachedAgent", {
            value: null,
            enumerable: false,
            configurable: false,
            writable: true
        });
        */

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
    /*
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
        *

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
            *

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
            *


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

        /*
        agent.createConnection = () => {

            let readable = new PassThrough();
            let writable = new PassThrough();

            let stream = new Duplex.from({
                readable,
                writable
            });

            stream.destroy = () => { };
            stream.ref = () => { };
            stream.unref = () => { };
            stream.setKeepAlive = () => { };
            stream.setTimeout = () => { };
            stream.setNoDelay = () => { };

            Interface.socket({
                iface: this,
                events: this.scope.events
            }, (err, socket) => {
                if (err) {

                    stream.emit("error", err);

                } else {

                    writable.pipe(socket)
                    socket.pipe(readable);

                }
            });

            return stream;

        };
        *

        this.cachedAgent = agent;
        return agent;

    }
    */


    httpAgent(options = {}) {

        options = Object.assign({
            keepAlive: true,
            maxSockets: 1,
        }, options);

        let agent = new Agent(options);

        agent.createConnection = () => {
            return this.bridge();
        };

        return agent;

    }

    httpsAgent(options = {}) {

        options = Object.assign({
            keepAlive: true,
            maxSockets: 1,
        }, options);

        let agent = new https.Agent(options);

        agent.createConnection = () => {

            let socket = this.bridge();
            let { host, port } = this.settings;

            return tls.connect({
                socket,
                host,
                port,
                ...options
            });

        };

        return agent;

    }


    bridge() {

        let { logger } = Interface.scope;
        let { host, port, socket: proto } = this.settings;

        let readable = new PassThrough();
        let writable = new PassThrough();

        let socket = new Duplex.from({
            readable,
            writable
        });

        // TODO: destroy ws stream here
        //socket.destroy = () => { };
        socket.ref = () => { };
        socket.unref = () => { };

        // forward calls here to connector
        // like socket request/response, use a `type=settings`
        socket.setKeepAlive = () => { };
        socket.setTimeout = () => { };
        socket.setNoDelay = () => { };

        // stream = WebSocket.createWebSocketStream
        // see routes/router.api.device.js
        Interface.socket(this._id, (err, stream, request) => {
            if (err) {

                socket.emit("error", err);

            } else {

                if (process.env.NODE_ENV === "development") {

                    socket.once("open", () => {
                        logger.debug(`Bridge open: iface ${this._id} <-> ${proto}://${host}:${port} (${request.uuid})`);
                    });

                    socket.once("close", () => {
                        logger.debug(`Bridge closed: iface ${this._id} <-> ${proto}://${host}:${port} (${request.uuid})`);
                    });

                }

                stream.once("close", () => {

                    // feedback
                    //logger.debug(`Bridge closed, destroy everything: iface ${this._id} <-> ${proto}://${host}:${port} (${request.uuid})`);

                    // TODO: Improve error handling/forwarding/cleanup
                    // socket.destroy() throws ABORT_ERR after emitting custom connection error
                    // socket.end() does not throw, but is it enough to cleanup everything?
                    // does it matter that 2 diffrent errors events are emitted?
                    // 1) "ECONN*", 2) AbortError after calling socket.destroy()
                    // The ABORT_ERR is not emitted as error, `// Unhandled 'error' event`...
                    // on what instance is the error thrown?

                    // destroy everything
                    socket.destroy();
                    readable.destroy();
                    writable.destroy();

                });

                // forward error on WebSocket.createWebSocketStream
                // used for syscall errors forwarding from connector
                stream.once("error", (...args) => {
                    logger.warn(args[0], "Error on WebSocket stream");
                    socket.emit("error", ...args);
                });

                writable.pipe(stream);
                stream.pipe(readable);

                process.nextTick(() => {
                    socket.emit("open");
                });

            }
        });

        return socket;

    }

    listen() {

        if (!this.settings?.listen) {
            throw new Error(".listen is set to false");
        }

        let emitter = new EventEmitter();

        Object.assign(emitter, {
            interface: this
        });

        LISTEN_INTERFACES.add(emitter);

        return emitter;

    }

    // bridge methods connects adapter with the underlaying network socket
    // create a `.socket()` method that returns the palin websocket stream
    /*
    static _bridge({ device, interface: iface, events }, cb) {
        return promisfy((done) => {

            console.log("Bridge request, iface", iface, device);

            // create a random uuid
            // used as identifier for responses
            let uuid = randomUUID();
            //let uuid = "4c6de542-f89f-42ac-a2b5-1c26f9e68d73";


            // timeout after certain time
            // no connector available, not mocks or whatever reaseon
            let caller = timeout(5000, (timedout, duration, args) => {
                if (timedout) {
                    done(new Error("TIMEDOUT"));
                } else {
                    done(null, args[0]);
                }
            });


            // socket response handler
            // listen for uuid and compare it with generated
            let handler = ({ stream, type, uuid: id, socket }) => {
                if (uuid === id && type === "response" && socket) {

                    console.log("adapter", iface.adapter);

                    /*
                    // create adapter stack here
                    // pass adapter stack as caller argument
                    //caller(stack);
                    let stack = iface.adapter.map((name) => {
                        try {
                            return require(path.join(process.cwd(), "adapter", `${name}.js`))();
                        } catch (err) {
                            console.error(`Error in adapter "${name}" `, err);
                        }
                    });

                    console.log("stack", stack);

                    stream = new Adapter(stack, stream, {
                        emitClose: false,
                        end: false
                    });

                    console.log("stream", stream)
                    *

                    caller(stream);

                }
            };

            events.on("socket", handler);

            events.emit("socket", {
                uuid,
                device,
                interface: iface._id,
                type: "request"
            });

        }, cb);
    }
        */

    static PENDING_BRIDGES = PENDING_BRIDGES;
    static WEBSOCKET_SERVER = WEBSOCKET_SERVER;
    static LISTEN_INTERFACES = LISTEN_INTERFACES;

    static socket(iface, cb) {
        return promisfy((done) => {

            let { logger } = Interface.scope;
            let cleanup = () => { };

            // timeout after certain time
            // no connector available, not mocks or whatever reaseon
            let caller = timeout(Number(process.env.CONNECT_TIMEOUT), (timedout, duration, args) => {
                if (timedout) {

                    // feedback
                    logger.warn(`Connection attempt timedout for interface "${iface}"`);

                    // removes pending event listnener
                    // which may never triggers
                    cleanup();

                    // pass timeot error
                    done(new Error("TIMEDOUT"));

                } else {

                    // feedback
                    logger.debug(`Bridge created for interface "${iface}" (${args[1].uuid})`);

                    // remove event handler
                    // remove pending bridge from set
                    cleanup();

                    // resolve with socket
                    done(null, ...args);

                }
            });

            // returns removeHandler function
            // cleanup registered event handler
            // otherwise "MaxListenersExceededWarning: Possible EventEmitter memory leak"
            cleanup = Interface.createBridge(iface, caller);

        }, cb);
    }


    static createBridgeRequest(iface) {
        return {
            iface,
            type: "request",
            uuid: randomUUID(),
            socket: true // TODO: remove, unecessary
            // NOTE: add a "options" object for net/udp options?
        };
    }

    static parseBridgeRequest(request, cb) {
        return ({ uuid, iface, type, socket, stream }) => {
            // TODO: remove `socket` property
            if (uuid === request.uuid && iface === request.iface && type === "response" && socket) {

                cb(stream);

            }
        };
    }

    static createBridge(iface, cb) {

        let { events } = Interface.scope;
        let request = Interface.createBridgeRequest(iface);

        PENDING_BRIDGES.add(request);

        let handler = Interface.parseBridgeRequest(request, (socket) => {
            // moved below into `removeHandler()`
            // removeHandler now gets called for:
            // scuccess & error situations like timeout
            // see `socket()` above
            //events.off("socket", handler);
            process.nextTick(cb, socket, request);
        });

        events.emit("socket", request);
        events.on("socket", handler);

        return function removeHandler() {

            // NOTE: 
            // when pending sockets are somehwere stored
            // here could they be removed, if needed

            // remove handler, which is never "resolves"
            // Interface.parseBridgeRequest cb is never fired
            events.off("socket", handler);

            PENDING_BRIDGES.delete(request);

        };

    }


};