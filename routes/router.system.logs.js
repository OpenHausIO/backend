const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const { WebSocket } = require("ws");
const { PassThrough } = require("stream");
const { createInterface } = require("readline");

const {
    LOG_PATH
} = process.env;

const LOGFILE = path.resolve(LOG_PATH, "combined.log");

const logger = require("../system/logger/index.js");
const Logger = require("../system/logger/class.logger.js");
const exporter = Logger.exporter();

// websocket server
const wss = new WebSocket.Server({
    noServer: true
});

// detect broken connections
const interval = setInterval(() => {
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


module.exports = (router) => {

    // NOTE: this is for compatibility reasons
    // in v4 the content from router.api.logs.js is moved here
    //require("./router.api.logs.js")(null, router);

    router.get("/", (req, res) => {
        if ((!req.headers["upgrade"] || !req.headers["connection"])) {

            let {
                limit = 0,
                offset = 0
            } = req.query;

            let output = [];
            let lines = 0;

            let readable = fs.createReadStream(LOGFILE);
            let rl = createInterface({
                input: readable
            });

            rl.on("line", (line) => {

                // count lines
                lines += 1;

                if (output.length >= limit && limit > 0) {
                    rl.close();
                    return;
                }

                if (offset < lines) {
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

                // a intermediate stream is needed, for cleanup and pipeing
                // directly in createrInterface({input}), it does not work
                let input = new PassThrough();
                exporter.pipe(input);

                ws.once("close", () => {

                    // prevent memeory/event emitter leak
                    // wihtout unpipe, after 10 connections a memeory leak warning is printed
                    exporter.unpipe(input);

                    rl.close();

                });

                let rl = createInterface({
                    input: exporter
                });

                rl.on("line", (line) => {
                    ws.send(line);
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

    router.put("/", (req, res) => {

        let {
            level = "debug",
            message = "Hello World"
        } = req.body;

        if (Object.hasOwnProperty.call(logger, level)) {

            logger[level](message);
            res.status(200).end();

        } else {

            // wrong logger level
            res.status(400).end();

        }

    });

    router.delete("/", (req, res) => {
        fs.readdir(LOG_PATH, {
            recursive: true
        }, (err, files) => {
            if (err) {

                res.status(500).json({
                    error: err
                });

            } else {
                try {

                    // build absolute paths
                    let logfiles = files.filter((name) => {
                        return name !== ".gitkeep";
                    }).map((name) => {
                        return path.join(LOG_PATH, name);
                    }).filter((file) => {
                        return !fs.statSync(file).isDirectory();
                    });

                    for (let file of logfiles) {
                        if (req.query.delete === "true") {
                            fs.rmSync(file);
                        } else {
                            fs.truncateSync(file);
                        }
                    }

                    // feedback
                    logger.warn(`Logfiles ${req.query.delete === "true" ? "deleted" : "truncated"}!`);

                    res.json(logfiles);

                } catch (err) {

                    res.status(500).json({
                        error: err
                    });

                }
            }
        });
    });

    router.post("/export", (req, res) => {
        try {

            // TODO: Ensure that only admins can download logs
            // a logfile may contain sensitive information!

            // TODO: use absolute path to tar
            // see: https://github.com/OpenHausIO/backend/issues/432
            let tar = exec(`tar -czv *`, {
                cwd: LOG_PATH,
                encoding: "buffer"
            });

            if (process.env.NODE_ENV === "development") {
                tar.stderr.pipe(process.stderr);
            }

            res.setHeader("content-type", "application/tar+gzip");

            tar.once("exit", (code) => {
                console.log("exit code", code);
                res.end();
            });

            tar.stdout.pipe(res);

        } catch (err) {

            console.log(err);

            res.status(500).json({
                error: err
            });

        }
    });

};