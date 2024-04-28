const WebSocket = require("ws");

const Notification = require("../system/notifications/class.notifications.js");
const events = Notification.events();

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


    events.on("publish", (event) => {
        wss.clients.forEach((ws) => {
            ws.send(JSON.stringify(event));
        });
    });


    router.get("/", (req, res) => {
        if ((!req.headers["upgrade"] || !req.headers["connection"])) {

            res.json(Notification.notifications());

        } else {
            wss.handleUpgrade(req, req.socket, req.headers, (ws) => {

                ws.isAlive = true;

                ws.on("pong", () => {
                    ws.isAlive = true;
                });

                wss.emit("connection", ws, req);

            });
        }
    });


    router.put("/", (req, res) => {

        let { title, message } = req.body;
        let notification = new Notification(title, message);

        notification.publish();
        res.json(notification);

    });


    return router;

};