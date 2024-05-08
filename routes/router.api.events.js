const WebSocket = require("ws");
const path = require("path");
const fs = require("fs");

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

    /*
    const componentNames = [
        "devices",
        "endpoints",
        "plugins",
        "rooms",
        "ssdp",
        "store",
        "vault"
    ];
    */

    // fix #403 "Add missing components"
    let componentNames = fs.readdirSync(path.resolve(process.cwd(), "components"));


    function reemit(event, component) {
        return (...args) => {

            let obj = JSON.stringify({
                component,
                event,
                args,
                //data: args[0]
            });

            wss.clients.forEach((client) => {
                // fix #403 "Implement named subscriptions"
                // added component name intents
                /*
                if (client.intents.includes(event) /*&& client.components.includes(component)* && client.readyState === WebSocket.OPEN) {
                    client.send(obj);
                }
                */

                let { readyState, filter } = client;

                if (readyState === WebSocket.OPEN && filter.events.includes(event) && filter.components.includes(component)) {
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

                // monkey patch intents for "named subscriptions"
                // see #403; get default everyhting
                // NOTE: remove the "default everything" part?
                /*
                ws.intents = req.query?.intents || [
                    "add",
                    "get",
                    "update",
                    "remove"
                ];

                // return all components on default
                //ws.components = req.query?.components || componentNames;
                */

                ws.filter = {
                    events: req.query.events || req.query.intents || [
                        "add",
                        "get",
                        "update",
                        "remove"
                    ],
                    components: req.query.components || componentNames
                };

                wss.emit("connection", ws, req);

            });

        }
    });

};