const Joi = require("joi");
const { Agent } = require("http");
const mongodb = require("mongodb");


module.exports = class Interface {

    constructor(obj, stream) {

        Object.assign(this, obj);
        this._id = String(obj._id);

        // hide stream object on interface
        Object.defineProperty(this, "stream", {
            value: stream
        });

        // NOTE: outsource this to a seperate file?!
        // share/set interface stream
        let { interfaceStreams } = global.sharedObjects;
        interfaceStreams.set(this._id, stream);

    }

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
            hupcl: Joi.boolean().default(true),
        }).required();

        const ETHERNET = Joi.object({
            transport: Joi.string().valid("tcp", "udp", "raw").default("tcp"),
            host: Joi.string().required(),
            port: Joi.number().min(1).max(65535).required(),
            // https://regex101.com/r/wF7Nfa/1
            // https://stackoverflow.com/a/50080404/5781499
            mac: Joi.string().default(null).regex(/^([0-9a-fA-F]{2}[:]){5}[0-9a-fA-F]{2}$/)
        }).required();

        // TODO iimplement
        return Joi.object({
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return new mongodb.ObjectID();
            }),
            type: Joi.string().default("ETHERNET"),
            //transport: Joi.string().valid("tcp", "udp", "ws").required(),   // NOTE: Change key to "socket"?! -> socket: "tcp" | "udp" | "raw"
            settings: Joi.object().when("type", {
                is: "ETHERNET",
                then: ETHERNET
            }).when("type", {
                is: "SERIAL",
                then: SERIAL
            }),
            adapter: Joi.array().items("base64", "eiscp", "json", "raw").default(["raw"])
        });

    }


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