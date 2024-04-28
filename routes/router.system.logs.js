const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const { WebSocket } = require("ws");
const { Readable } = require("stream");
const { createInterface } = require("readline");

const {
    LOG_PATH
} = process.env;

const LOGFILE = path.resolve(LOG_PATH, "combined.log");

const logger = require("../system/logger");

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

                let controller = new AbortController(); // used to stop watcher
                let { signal } = controller;

                let input = new Readable({
                    read() { }
                });

                let rl = createInterface({
                    input
                });

                rl.on("line", (line) => {
                    ws.send(line);
                });

                // cleanup when ws connection is closed
                // everything triggers ws.terminate();
                // whitch results in emitting close
                ws.once("close", () => {
                    controller.abort(); // stop fs.watch()
                    rl.close(); // stop readline
                    input.destroy(); // destory readable
                });

                fs.open(LOGFILE, "r", (err, fd) => {

                    if (err) {
                        ws.terminate();
                        return;
                    }

                    let position = 0;
                    let prev_stats = null;

                    fs.stat(LOGFILE, (err, stats) => {
                        if (err) {

                            console.error(err);
                            ws.terminate();

                        } else {

                            // set position to end of file
                            // receive only new messages
                            prev_stats = stats;
                            position = stats.size;

                        }
                    });

                    let watcher = fs.watch(LOGFILE, {
                        signal
                    });

                    watcher.once("error", () => {
                        ws.terminate();
                    });

                    watcher.on("change", () => {

                        // could be possible that changes  happens before stats are available
                        // this would break and flood everything from the log file
                        if (!prev_stats) {
                            return;
                        }

                        fs.stat(LOGFILE, (err, stats) => {
                            if (err) {

                                console.error(err);
                                ws.terminate();

                            } else {

                                if (prev_stats.size > stats.size) {
                                    position = 0;
                                }

                                prev_stats = stats;

                            }
                        });

                        fs.read(fd, {
                            position,
                            encoding: "utf8"
                        }, (err, bytesRead, buffer) => {
                            if (err) {

                                console.error(err);
                                ws.terminate();

                            } else {

                                position += bytesRead;
                                input.push(buffer.slice(0, bytesRead));

                            }
                        });

                    });

                    // close event loop
                    watcher.unref();

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