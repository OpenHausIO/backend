const path = require("path");
const fs = require("fs");
const { client } = require("mongodb");
//const { EventEmitter } = require("events");

const {
    LOG_PATH,
    PLUGINS_PATH
} = process.env;


//const logger = require("../system/logger/index.js");
//const Logger = require("../system/logger/class.logger.js");
//const log = new Logger();


module.exports = (router) => {

    /*
    const emitter = new EventEmitter();

    const progress = {
        locked: false,
        precent: 0,
        completed: false,
        timestamp: null
    };

    emitter.on("progress", (value) => {

        console.log("--->", value);
        progress.precent = value;
        progress.timestamp = Date.now();

        if (value >= 100) {

            //progress.operation = null;
            progress.locked = false;
            progress.completed = true;

            setImmediate(() => {
                console.log("progress", progress);
                emitter.emit("complete");
            });

        }

    });
    */

    router.delete("/", (req, res) => {

        /*
        if (progress.locked) {
            return res.status(423).json({
                message: "Operation in progress",
                progress
            });
        }

        progress.locked = true;
        progress.precent = 0;
        progress.completed = false
        let filesDeleted = 0;
        */

        let { includes = [] } = req.query;

        // delete logfiles
        if (includes.includes("logfiles")) {
            fs.readdirSync(LOG_PATH, {
                recursive: true
            }).map((entry) => {

                return path.join(LOG_PATH, entry);

            }).forEach((file) => {

                fs.rmSync(file, {
                    recursive: true,
                    force: true
                });

            });
        }

        // delete plugins
        // TODO: use "plugin paths"
        if (includes.includes("plugins")) {
            fs.readdirSync(PLUGINS_PATH, {
                recursive: true
            }).filter((entry) => {

                // keep those files
                return ![".gitkeep"].includes(entry);

            }).map((entry) => {

                return path.join(PLUGINS_PATH, entry);

            }).forEach((file) => {

                // arr.length = total files
                // filesDeleted = processed files

                fs.rmSync(file, {
                    recursive: true,
                    force: true
                });

            });
        }

        // delete database
        if (includes.includes("database")) {
            client.collections().then((collections) => {
                collections.forEach((collection) => {
                    collection.drop();
                });
            });
        }

        if (includes.includes(".env")) {
            fs.rmSync(path.join(process.cwd(), ".env"));
        }

        res.json({
            success: true
        });

    });

    /*
    router.get("/progress", (req, res) => {

        console.log("/progress called");

        /*
        if (!progress.locked) {
            return res.status(102).end();
        }
        *

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        /*
        let onProgress = throttle(() => {
            res.write(`data: ${JSON.stringify(progress)}\n\n`);
        }, 100); //300
        *

        let onProgress = () => {
            res.write(`data: ${JSON.stringify(progress)}\n\n`);
        };

        let onComplete = () => {

            res.write(`data: ${JSON.stringify(progress)}\n\n`);

            emitter.off("progress", onProgress);
            emitter.off("complete", onComplete);

            res.end();

        };

        emitter.on("progress", onProgress);
        emitter.once("complete", onComplete);

        req.on("close", () => {
            emitter.off("progress", onProgress);
            emitter.off("complete", onComplete);
        });

    });
    */

};