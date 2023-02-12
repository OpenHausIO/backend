const { decode } = require("dns-packet");

const C_MDNS = require("../components/mdns");

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

        console.log("Request to /ai/mdns");

        // check if connection is a simple get request or ws client
        if ((!req.headers["upgrade"] || !req.headers["connection"])) {
            //return res.status(403).end();
            next(); // let the rest-handler.js do its job
        }

        // listen for websockt clients
        // keep sending new log entrys to client
        wss.once("connection", (ws) => {

            console.log("Clien connected to mdns");

            ws.on("message", (msg) => {
                C_MDNS.events.emit("message", decode(msg), msg);
            });

            ws.on("close", () => {
                console.log("Client disconnected disolaskjdflaskjfdasdf");
            });


            // QUERY LOCAL DNS
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