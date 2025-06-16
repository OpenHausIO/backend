const WebSocket = require("ws");
//const { finished } = require("stream");
const C_DEVICES = require("../components/devices");
const { WEBSOCKET_SERVER } = require("../components/devices/class.interface.js");

const { connections } = require("../system/worker/shared.js");
const MessagePortStream = require("../system/worker/class.messageportstream.js");
const { MessageChannel } = require("worker_threads");

//const iface_locked = new Map();

// move that to "event bus"
//const { interfaceServer, interfaceStreams } = global.sharedObjects;
//const { interfaceServer } = require("../system/shared.js");


// map os syscall codes to ws codes
// https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code
const ERROR_CODE_MAPPINGS = {
    4001: "ECONNREFUSED",       // -111
    4002: "ECONNRESET",         // -104
    4003: "EADDRINUSE",         // -98
    4004: "EADDRNOTAVAIL",      // -99
    4005: "ETIMEDOUT",          // -110
    4006: "EHOSTUNREACH",       // -113
    4007: "ENETUNREACH",        // -101
    4008: "ENOTFOUND",          // -3008
    4009: "EPERM",              // -1
    4010: "EACCES",             // -13
    4011: "EPIPE",              // -32
    4012: "EINVAL",             // -22
    4013: "ENOENT",             // -2
    "ECONNREFUSED": -111,       // 4001
    "ECONNRESET": -104,         // 4002
    "EADDRINUSE": -98,          // 4003
    "EADDRNOTAVAIL": -99,       // 4004
    "ETIMEDOUT": -110,          // 4005
    "EHOSTUNREACH": -113,       // 4006
    "ENETUNREACH": -101,        // 4007
    "ENOTFOUND": -3008,         // 4008
    "EPERM": -1,                // 4009
    "EACCES": -13,              // 4010
    "EPIPE": -32,               // 4011
    "EINVAL": -22,              // 4012
    "ENOENT": -2                // 4013
};


module.exports = (app, router) => {

    // https://github.com/websockets/ws#how-to-detect-and-close-broken-connections


    router.get("/:_id/interfaces/:_iid", (req, res) => {


        let iface = req.item.interfaces.find((iface) => {
            return String(iface._id) === String(req.params._iid);
        });

        if (!iface && !req.query?.socket) {
            return res.status(404).end();
        }

        // allow multipel connections to new connection handling below
        if (iface.upstream && !req.query?.socket) {
            return res.status(423).end();
        }

        if ((!req.headers["upgrade"] || !req.headers["connection"])) {

            // no websocket handshake
            // output iface as json
            res.json(iface);

        } else {

            // TODO: This should be moved into the device component
            // A websocket server should be created in the class.interface.js file
            // Static method can return them e.g. Interface.servers() = returns array of wss
            // Goal should be:
            // - to eliminate the need of "shared.js"
            // - handle in router.get only ws handshake: "wss.handleUpgrade(...)"
            if (!WEBSOCKET_SERVER.has(req.params._iid)) {

                let wss = new WebSocket.Server({
                    noServer: true
                });

                WEBSOCKET_SERVER.set(req.params._iid, wss);

                // listen only once to connectoin event
                // gets fired every time websocket client hit this url/route
                wss.on("connection", (ws, req) => {
                    // TODO: check for pending request, if not peding, terminate ws connection
                    if (req.query?.uuid && req.query?.socket === "true" && req.query?.type === "response") {

                        // new bridge/connector practice
                        // see https://github.com/OpenHausIO/backend/issues/460

                        let stream = WebSocket.createWebSocketStream(ws);

                        if (process.env.WORKER_THREADS_ENABLED === "true") {

                            if (connections.has(req.query.uuid)) {

                                let worker = connections.get(req.query.uuid);
                                let { port1, port2 } = new MessageChannel();

                                let socket = new MessagePortStream(port1);

                                stream.pipe(socket);
                                socket.pipe(stream);

                                worker.postMessage({
                                    component: "devices",
                                    event: "socket",
                                    uuid: req.query.uuid,
                                    iface: req.params._iid,
                                    type: "response",
                                    port: port2
                                }, [port2]);

                                // cleanup
                                connections.delete(req.query.uuid);

                            }

                        } else {

                            ws.once("close", (code) => {
                                if (code >= 4000 && code <= 4999) {

                                    // error on connection attempt
                                    // underlaying os trhowed error
                                    // build custom connection error
                                    let err = new Error("Bridging failed");
                                    err.code = ERROR_CODE_MAPPINGS[code];
                                    err.errno = ERROR_CODE_MAPPINGS[err.code];
                                    err.syscall = "connect";

                                    stream.emit("error", err);

                                } else {

                                    // no clue why closed, cleanup anyway
                                    // TODO: check code and decide if error or success closing
                                    //stream.emit("close"); // desotroy() emit close event(!|?)
                                    if (code === 1005 || code === 1000) {
                                        console.log("end normaly");
                                        stream.end();
                                        //stream.emit("end");
                                    } else {
                                        //console.log("End destory");
                                        stream.destroy();
                                    }

                                }
                            });

                            C_DEVICES.events.emit("socket", {
                                uuid: req.query.uuid,
                                iface: req.params._iid,
                                type: "response",
                                socket: true,
                                stream
                            });

                        }

                    } else {

                        // old/legacy connection mechanism
                        // TODO: Remove this in future versions
                        ws.close(1008, "LEGACY_CONNECTION_NOT_SUPPORTED_ANYMORE");

                        // maybe this is needed later for things like serial port data transmission
                        // how to forward data between a plugin and serialport, via CLI tool, like "socketize"?

                        /*
                        let upstream = WebSocket.createWebSocketStream(ws);

                        // Cleanup: https://nodejs.org/dist/latest-v16.x/docs/api/stream.html#streamfinishedstream-options-callback
                        let cleanup = finished(upstream, () => {
                            iface.detach(() => {
                                cleanup();
                            });
                        });


                        iface.attach(upstream);


                        //https://github.com/websockets/ws#how-to-detect-and-close-broken-connections
                        ["close", "error"].forEach((event) => {
                            upstream.once(event, () => {

                                upstream.destroy();
                                iface.detach();

                            });
                        });
                        */

                    }
                });


                let interval = setInterval(() => {
                    wss.clients.forEach((ws) => {

                        if (!ws.isAlive) {
                            console.log("Stream died, terminate it!");
                            ws.terminate();
                            return;
                        }

                        ws.isAlive = false;
                        ws.ping();

                    });
                }, Number(process.env.API_WEBSOCKET_TIMEOUT));


                wss.on("close", () => {
                    clearInterval(interval);
                });


            }


            let wss = WEBSOCKET_SERVER.get(req.params._iid);


            wss.handleUpgrade(req, req.socket, req.headers, (ws) => {

                ws.isAlive = true;

                ws.on("pong", () => {
                    ws.isAlive = true;
                });

                wss.emit("connection", ws, req);

            });

        }

    });

};