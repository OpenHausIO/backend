const Joi = require("joi");
const { Agent } = require("http");
const https = require("https");
const tls = require("tls");
const mongodb = require("mongodb");
const { Duplex, PassThrough } = require("stream");
const { randomUUID } = require("crypto");
//const path = require("path");

//const Adapter = require("./class.adapter.js");


const timeout = require("../../helper/timeout.js");
const promisfy = require("../../helper/promisify.js");
const { isMainThread, parentPort } = require("worker_threads");
const MessagePortStream = require("../../system/worker/class.messageportstream.js");

const PENDING_BRIDGES = new Set();
const WEBSOCKET_SERVER = new Map();

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
                    socket.emit("error", ...args);
                });

                process.nextTick(() => {

                    socket.emit("open");

                    writable.pipe(stream);
                    stream.pipe(readable);

                });

            }
        });

        return socket;

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

    // TODO: Rename to parseBridgeResponse
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

        // check if in worker trhead
        // if yes: post message to main thread
        //   listen for response
        // if no: do nothign

        if (!isMainThread) {

            let handleMessage = (data) => {
                if (data.component === "devices" && data.event === "socket" && data.uuid === request.uuid && data.type === "response" && data.port) {

                    // data.event = socket
                    // data.uuid = request uuid
                    // data.iface = iface mongodb id
                    // data.type = reponse
                    // data.port = message port

                    // remove message handler
                    parentPort.off("message", handleMessage);

                    // create stream from message port
                    // which is used as the underlaying "socket"
                    let stream = new MessagePortStream(data.port);

                    // call handler
                    // NOTE: emit "socket" event?
                    // to notify other threads/things that a response was send
                    // but without the stream/message port, this has no real benefit
                    Reflect.apply(handler, this, [{
                        uuid: data.uuid,
                        iface: data.iface,
                        type: "response",
                        socket: true,
                        stream
                    }]);


                }
            };

            parentPort.on("message", handleMessage);

            // tell main we are waiting for a socket
            parentPort.postMessage({
                component: "devices",
                event: "socket",
                request
            });

            // forward message via events
            events.emit("socket", request);

        } else {

            events.emit("socket", request);
            events.on("socket", handler);

        }

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