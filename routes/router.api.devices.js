const WebSocket = require("ws");
const { finished } = require("stream");
const C_DEVICES = require("../components/devices");

//const iface_locked = new Map();

// move that to "event bus"
//const { interfaceServer, interfaceStreams } = global.sharedObjects;
const { interfaceServer } = require("../system/shared.js");



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
            if (!interfaceServer.has(req.params._iid)) {

                let wss = new WebSocket.Server({
                    noServer: true
                });

                interfaceServer.set(req.params._iid, wss);

                // listen only once to connectoin event
                // gets fired every time websocket client hit this url/route
                wss.on("connection", (ws, req) => {
                    if (req.query?.uuid && req.query?.socket === "true" && req.query?.type === "response") {

                        // new bridge/connector practice
                        // see https://github.com/OpenHausIO/backend/issues/460

                        let stream = WebSocket.createWebSocketStream(ws);

                        ws.once("close", (...args) => {
                            stream.emit("close", ...args);
                            stream.destroy();
                        });


                        C_DEVICES.events.emit("socket", {
                            uuid: req.query.uuid,
                            iface: req.params._iid,
                            type: "response",
                            socket: true,
                            stream
                        });

                    } else {

                        // old/legacy connection mechanism
                        // TODO: Remove this in future versions

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


            let wss = interfaceServer.get(req.params._iid);


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