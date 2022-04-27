const Joi = require("joi");
const { Agent } = require("http");
const mongodb = require("mongodb");

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
        let { interfaceStreams } = global.sharedObjects;
        interfaceStreams.set(this._id, stream);

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
            mac: Joi.string().default(null).regex(/^([0-9a-fA-F]{2}[:]){5}[0-9a-fA-F]{2}$/)
        }).required();

        return Joi.object({
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return new mongodb.ObjectID();
            }),
            type: Joi.string().default("ETHERNET"),
            settings: Joi.object().when("type", {
                is: "ETHERNET",
                then: ETHERNET
            }).when("type", {
                is: "SERIAL",
                then: SERIAL
            }),
            adapter: Joi.array().items("base64", "eiscp", "json", "raw").default(["raw"]),
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
    httpAgent(options) {

        options = Object.assign({
            keepAlive: true,
            maxSockets: 1,
            keepAliveMsecs: 3000,        // use this as websocket ping/pong value to detect broken connections?
        }, options);

        // stream nc tcp socket 
        // https://stackoverflow.com/a/33514724/5781499
        let agent = new Agent(options);

        // use interface stream as socket
        // createConnection returns duplex stream
        // https://nodejs.org/dist/latest-v14.x/docs/api/http.html#http_agent_createconnection_options_callback
        agent.createConnection = (options, cb) => {

            // TODO create fake socket
            // do not mess with interfaceStream
            let socket = this.stream;

            // TODO implement other socket functions?!
            socket.ref = (...args) => { console.log("socket.ref called", ...args); };
            socket.unref = (...args) => { console.log("socket.unref called", ...args); };
            socket.setKeepAlive = (...args) => { console.log("socket.setKeepAlive called", ...args); };
            socket.setTimeout = (...args) => { console.log("socket.setTimeout called", ...args); };
            socket.setNoDelay = (...args) => { console.log("socket.setNoDelay called", ...args); };

            //return socket;
            cb(null, socket);

        };

        return agent;

    }


};