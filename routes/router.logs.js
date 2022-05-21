// internal modules
const fs = require("fs");
const readline = require("readline");
const { Readable } = require("stream");

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
    router.get("/", (req, res) => {

        // logpath to combined logfile
        let logfile = `${process.env.LOG_PATH}/combined.log`;

        // readable stream for readline module
        let readable = new Readable({
            read() { }
        });

        // open the logfile and watch for changes
        // push changes into readable stream
        fs.open(logfile, (err, fd) => {
            if (err) {
                console.error(err);
                process.exit();
            } else {

                let position = 0;

                // initial read
                // set offset bytes
                fs.read(fd, {
                    position
                }, (err, bytesRead, buffer) => {
                    if (err) {

                        console.erro(err);
                        process.exit();

                    } else {

                        position += bytesRead;
                        readable.push(buffer.slice(0, bytesRead));

                    }
                });

                // listen for file changes
                // push to readable stream 
                // add readed bytes to offset
                fs.watch(logfile, (event) => {
                    if (event === "change") {

                        fs.read(fd, {
                            position
                        }, (err, bytesRead, buffer) => {
                            if (err) {

                                console.erro(err);
                                process.exit(1);

                            } else {

                                position += bytesRead;
                                readable.push(buffer.slice(0, bytesRead));

                            }
                        });

                    }
                });

            }
        });

        // check if connection is a simple get request and return logfile lines
        // or handle the connection as websocket and keep push new log messages?
        if ((!req.headers["upgrade"] || !req.headers["connection"])) {

            let {
                limit = 100,
                offset = 0
            } = req.query;

            let output = [];
            let lines = 0;

            let rl = readline.createInterface({
                input: readable
            });

            rl.on("line", (line) => {

                // count lines
                lines += 1;

                if (output.length >= limit) {
                    rl.close();
                    return;
                }

                if (offset <= lines) {
                    output.push(JSON.parse(line));
                }

            });

            rl.on("close", () => {
                res.json(output);
            });

        } else {

            // listen for websockt clients
            // keep sending new log entrys to client
            wss.once("connection", (ws) => {

                readable.on("end", () => {
                    ws.close();
                });

                let rl = readline.createInterface({
                    input: readable
                });

                rl.on("line", (line) => {
                    ws.send(String(line));
                });

                rl.on("close", () => {
                    ws.close();
                });

                ws.on("close", () => {
                    rl.close();
                    readable.destroy();
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

        }

    });

};