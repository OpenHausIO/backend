const WebSocket = require("ws");

module.exports = (app, router) => {

    let wss = new WebSocket.Server({
        noServer: true
    });

    const componentNames = [
        "rooms",
        "users",
        "devices",
        "endpoints",
        //"scenes",
        "plugins"
    ];


    function reemit(event, component) {
        return (data) => {

            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {

                    let obj = JSON.stringify({
                        component,
                        event,
                        data: data[0]
                    });

                    client.send(obj);

                }
            });

        };
    }


    componentNames.map((name) => {
        try {

            let component = require(`../components/${name}/index.js`);

            component.events.on("add", reemit("add", name));
            component.events.on("get", reemit("get", name));
            component.events.on("update", reemit("update", name));
            component.events.on("remove", reemit("remove", name));

        } catch (err) {

            console.error("Failure in events http api", err);

            // re throw
            throw err;

        }
    });


    router.get("/", (req, res) => {
        if ((!req.headers["upgrade"] || !req.headers["connection"])) {

            // no websocket handshake
            res.status(421).end();

        } else {

            wss.handleUpgrade(req, req.socket, req.headers, (ws) => {
                wss.emit("connection", ws, req);
            });

        }
    });

};