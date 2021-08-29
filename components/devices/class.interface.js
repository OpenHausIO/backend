const Joi = require("joi");
const { Agent } = require("http");
const { Socket } = require("net");
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

    };

    static schema() {
        // TODO iimplement
        return Joi.object({
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return new mongodb.ObjectID();
            }),
            type: Joi.string().default("ETHERNET"),
            settings: {
                host: Joi.string().required(),
                port: Joi.number().min(1).max(65535).required()
            },
            adapter: Joi.array().items("base64", "eiscp", "json", "raw").default(["raw"])
        });
    };


    httpAgent(options) {

        options = Object.assign({
            keepAlive: true,
            maxSockets: 1,
            keepAliveMsecs: 3000,        // use this as websocket ping/pong value to detect broken connections?
        }, options)

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
            socket.ref = (...args) => { console.log("socket.ref called", ...args) };
            socket.unref = (...args) => { console.log("socket.unref called", ...args) };
            socket.setKeepAlive = (...args) => { console.log("socket.setKeepAlive called", ...args) };
            socket.setTimeout = (...args) => { console.log("socket.setTimeout called", ...args) };
            socket.setNoDelay = (...args) => { console.log("socket.setNoDelay called", ...args) };

            //return socket;
            cb(null, socket);

        };

        return agent;

    };


};