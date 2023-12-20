const path = require("path");
const { pipeline } = require("stream");
const { exec } = require("child_process");
const fs = require("fs/promises");
const readline = require("readline");

module.exports = (app, router) => {

    router.put("/:_id/files", (req, res) => {

        if (Number(req.headers["content-length"]) <= 0) {
            return res.status(400).json({
                error: "Invalid upload size."
            });
        }

        let p = path.resolve(process.cwd(), "plugins", req.item.uuid);
        let tar = exec(`tar vzxf - -C ${p}`);

        tar.once("exit", (code) => {

            if (code > 0) {
                if (!res.headersSent) {

                    res.status(400).json({
                        error: "tar could not read input file. Upload failed/client failer?",
                        details: `tar exit code ${code}`
                    });

                }
            }

            // trigger closing pipeline below
            tar.stdin.end();

        });

        let rl = readline.createInterface({
            input: tar.stdout,
            //output: process.stdout
        });

        if (process.env.NODE_ENV === "development") {
            rl.on("line", (line) => {

                console.log("Extract file:", line);
                //console.log("Extract file:", path.join(p, line));

            });
        }

        pipeline(req, tar.stdin, (err) => {

            if (!res.headersSent) {
                if (err) {

                    res.status(500).json({
                        error: err.message
                    });

                } else {

                    res.json(req.item);

                }
            }

            rl.close();

        });

    });

    router.delete("/:_id/files", async (req, res) => {
        try {

            let p = path.resolve(process.cwd(), "plugins", req.item.uuid);

            for (let file of await fs.readdir(p)) {
                await fs.rm(path.join(p, file), {
                    recursive: true
                });
            }

            res.json(req.item);

        } catch (err) {

            res.status(500).end(err.message);

        }
    });

    router.post("/:_id/start", (req, res) => {
        try {

            req.item.start();
            res.json(req.item);

        } catch (err) {

            res.status(500).json({
                error: err.message,
                stack: err.stack
            });

        }
    });

    /*
    router.post("/:_id/stop", (req, res) => {
        try {

            req.item.stop();
            res.json(req.item);

        } catch (err) {

            res.status(500).end(err);

        }
    });
    */

};