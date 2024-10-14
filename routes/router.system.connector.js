const C_DEVICES = require("../components/devices");
const { PENDING_BRIDGES } = require("../components/devices/class.interface.js");

// external modules
const WebSocket = require("ws");

module.exports = (router) => {

    // websocket server
    let wss = new WebSocket.Server({
        noServer: true
    });

    // detect broken connections
    let interval = setInterval(() => {
        wss.clients.forEach((ws) => {

            if (!ws.isAlive) {
                ws.terminate();
                return;
            }

            ws.isAlive = false;
            ws.ping();

        });
    }, Number(process.env.API_WEBSOCKET_TIMEOUT));


    // if the server closes
    // clear the interval
    wss.on("close", () => {
        clearInterval(interval);
    });


    wss.on("connection", (ws) => {
        if (PENDING_BRIDGES.size > 0 && ws.readyState === WebSocket.OPEN) {

            PENDING_BRIDGES.forEach((bridge) => {
                ws.send(JSON.stringify(bridge));
            });
        }
    });


    C_DEVICES.events.on("socket", (obj) => {
        if (obj.type === "request") {
            wss.clients.forEach((ws) => {
                ws.send(JSON.stringify(obj));
            });
        }
    });


    // http route handler
    // TODO: Reformat to match router.api.mdns.js code style/if-else
    router.get("/", (req, res, next) => {

        // check if connection is a simple get request or ws client
        if ((!req.headers["upgrade"] || !req.headers["connection"])) {
            //return res.status(403).end();
            next(); // let the rest-handler.js do its job
            return;
        }

        // handle request as websocket
        // perform websocket handshake 
        wss.handleUpgrade(req, req.socket, req.headers, (ws) => {

            ws.isAlive = true;

            ws.on("pong", () => {
                ws.isAlive = true;
            });

            wss.emit("connection", ws, req);

        });

    });

};