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


    // listen for websockt clients
    // forward messages between component & ws client
    wss.on("connection", (ws) => {

        let { logger } = C_MQTT;

        let transmitter = (packet, item, payload) => {
            ws.send(packet, (err) => {
                if (err) {

                    logger.warn(`Could not publish on topic ${item.topic}`);

                } else {

                    logger.trace(`Send publish: ${item.topic}=${payload}`);

                }
            });
        };

        C_MQTT.events.emit("connected", ws);

        ws.on("message", (msg) => {
            C_MQTT.events.emit("message", msg);
        });

        ws.on("close", () => {
            C_MQTT.events.off("transmit", transmitter);
            C_MQTT.events.emit("disconnected", ws);
        });

        // helper event for publishing on topics
        C_MQTT.events.on("transmit", transmitter);

    });


    // http route handler
    router.get("/", (req, res, next) => {

        // check if connection is a simple get request or ws client
        if ((!req.headers["upgrade"] || !req.headers["connection"])) {
            //return res.status(403).end();
            next(); // let the rest-handler.js do its job
            return;
        }

        if (wss.clients.size > 0) {
            return res.status(423).end();
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