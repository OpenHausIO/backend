const WebSocket = require("ws");

module.exports = (app, router) => {

    let wss = new WebSocket.Server({
        noServer: true
    });

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


    wss.on("close", () => {
        clearInterval(interval);
    });


    const componentNames = [
        "devices",
        "endpoints",
        "plugins",
        "rooms",
        "ssdp",
        "store",
        "vault"
    ];


    function reemit(event, component) {
        return (args) => {

            let obj = JSON.stringify({
                component,
                event,
                args,
                data: args[0]
            });

            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(obj);
                }
            });

        };
    }

    // create reemit more automaticly
    // TODO: loop over events defined in .events
    // https://nodejs.org/dist/latest-v16.x/docs/api/events.html#emittereventnames
    componentNames.forEach((name) => {
        try {

            let component = require(`../components/${name}/index.js`);

            // gets every method which is create with `._defineMethod`
            // find a way to find other methods? -> no, because they dont emit anything
            Object.getOwnPropertyNames(component).filter((prop) => {
                return component[prop] instanceof Function;
            }).forEach((method) => {
                component.events.on(method, reemit(method, name));
            });

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

                ws.isAlive = true;

                ws.on("pong", () => {
                    ws.isAlive = true;
                });

                wss.emit("connection", ws, req);

            });

        }
    });

};