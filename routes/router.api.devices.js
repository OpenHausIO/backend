const WebSocket = require("ws");
const { finished } = require("stream");

//const iface_locked = new Map();

// move that to "event bus"
//const { interfaceServer, interfaceStreams } = global.sharedObjects;
const { interfaceServer, interfaceStreams } = require("../system/shared.js");



module.exports = (app, router) => {

    // https://github.com/websockets/ws#how-to-detect-and-close-broken-connections


    router.get("/:_id/interfaces/:_iid", (req, res) => {


        let iface = req.item.interfaces.find((iface) => {
            return String(iface._id) === String(req.params._iid);
        });

        if (!iface) {
            return res.status(404).end();
        }

        if (iface.upstream) {
            return res.status(423).end();
        }

        if ((!req.headers["upgrade"] || !req.headers["connection"])) {

            // no websocket handshake
            // output iface as json
            res.json(iface);

        } else {


            if (!interfaceServer.has(req.params._iid)) {

                let wss = new WebSocket.Server({
                    noServer: true
                });

                interfaceServer.set(req.params._iid, wss);

                // listen only once to connectoin event
                // gets fired every time websocket client hit this url/route
                wss.on("connection", (ws) => {

                    // set connection to "alive"
                    // see #148
                    ws.isAlive = true;

                    let upstream = WebSocket.createWebSocketStream(ws);

                    // Cleanup: https://nodejs.org/dist/latest-v16.x/docs/api/stream.html#streamfinishedstream-options-callback
                    let cleanup = finished(upstream, (err) => {
                        console.log("Foo Bar uzpstream fucker", err);
                        iface.detach(() => {
                            console.log("Upstream useless, destoreyd");
                            cleanup();
                        });
                    });

                    // -----------------------------------------

                    iface.attach(upstream);

                    interfaceStreams.set(req.params._iid, upstream);

                    //https://github.com/websockets/ws#how-to-detect-and-close-broken-connections
                    ["close", "error"].forEach((event) => {
                        upstream.once(event, () => {

                            upstream.destroy();

                            iface.detach(() => {
                                interfaceStreams.delete(req.params._iid);
                            });

                        });
                    });

                    // detect broken connection
                    ws.on("pong", () => {
                        //console.log("pong", Date.now(), "\r\n\r\n")
                        ws.isAlive = true;
                    });

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
                wss.emit("connection", ws, req);
            });

        }

    });

};