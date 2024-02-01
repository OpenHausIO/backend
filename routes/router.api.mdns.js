const { decode } = require("dns-packet");

const C_MDNS = require("../components/mdns");

// external modules
const WebSocket = require("ws");

module.exports = (app, router) => {

    // websocket server
    let wss = new WebSocket.Server({
        noServer: true
    });


    /*
    C_MDNS.events.on("query", (query) => {        
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(query);
            }
        });        
    });
    */

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
    // TODO: Reformat to match router.api.mdns.js code style/if-else
    router.get("/", (req, res, next) => {

        // check if connection is a simple get request or ws client
        if ((!req.headers["upgrade"] || !req.headers["connection"])) {
            //return res.status(403).end();
            next(); // let the rest-handler.js do its job
            return;
        }

        // listen for websockt clients
        // keep sending new log entrys to client
        // TODO: Move this outside the get handler
        // see: #426
        wss.once("connection", (ws) => {

            C_MDNS.events.emit("connected", ws);

            ws.on("message", (msg) => {
                C_MDNS.events.emit("message", decode(msg), msg);
            });


            // QUERY LOCAL DNS
            // TODO: Move this into the mdns component
            /*
            setInterval(() => {

                console.log("Query for HTTP Server");

                let msg = encode({
                    type: "query",
                    id: 1,
                    flags: RECURSION_DESIRED,
                    questions: [{
                        type: "A",
                        //name: '_http._tcp.local'
                        name: "*"
                    }]
                });

                ws.send(msg);

            }, 30_000);
            */

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