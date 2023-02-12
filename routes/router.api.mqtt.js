const C_MQTT = require("../components/mqtt");

// external modules
const WebSocket = require("ws");

module.exports = (app, router) => {

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


    // http route handler
    router.get("/", (req, res, next) => {

        console.log("Request to /ai/mqtt");

        // check if connection is a simple get request or ws client
        if ((!req.headers["upgrade"] || !req.headers["connection"])) {
            //return res.status(403).end();
            next(); // let the rest-handler.js do its job
        }

        // listen for websockt clients
        // keep sending new log entrys to client
        wss.once("connection", (ws) => {

            C_MQTT.events.emit("connected", ws);

            ws.on("message", (msg) => {
                C_MQTT.events.emit("message", msg);
            });

            ws.on("close", () => {
                console.log("MQTT Client disconnected disolaskjdflaskjfdasdf");
                C_MQTT.events.emit("disconnected", ws);
            });

        });

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