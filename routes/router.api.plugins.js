const path = require("path");
const { pipeline } = require("stream");
const { exec } = require("child_process");
const process = require("process");
const fs = require("fs/promises");
const { statSync } = require("fs");

//const C_PLUGINS = require("../components/plugins");

module.exports = (app, router) => {

    // this router gets executed before the rest-handler.js params handler
    // but why when this middleware is defined after the rest-handler stuff?!
    // execution order:
    // 1) the router middleware wehre `req.install` & `req.folder` are set below
    // 2) rest-handler.js req.prams("_id") middleware
    // 3) router handler below like "/start", "/<_id>/files"
    // Outcommented, see issue #444: https://github.com/OpenHausIO/backend/issues/444#issuecomment-2094341348
    // > looks like its not possible to archive the functionality above with a middleware function on all routes
    /*
    router.use((req, res, next) => {

        console.log("2) plugin middleware", C_PLUGINS.items, req.item, req.params);

        req.install = req.params?.install === "true" || false;
        req.folder = path.join(process.cwd(), "plugins", req.item?.uuid || "");

        console.log("Install:", req.install);
        console.log("Folder", req.folder);

        next();

    });
    */

    const variables = (req, res, next) => {

        req.install = req.query?.install === "true" || false;
        req.folder = path.join(process.cwd(), "plugins", req.item.uuid);

        next();

    };

    router.put("/:_id/files", variables, (req, res) => {

        if (Number(req.headers["content-length"]) <= 0) {
            return res.status(400).json({
                error: "Invalid upload size."
            });
        }

        //let p = path.resolve(process.cwd(), "plugins", req.item.uuid);
        let tar = exec(`tar vzxf - -C ${req.folder}`);

        tar.once("exit", (code) => {

            if (code > 0) {
                if (!res.headersSent) {

                    res.status(400).json({
                        error: "tar could not read input file. Upload failed/client failer?",
                        details: `tar exit code ${code}`
                    });

                }
            } else {

                // skip installation step below
                if (!req.install) {
                    res.json(req.item);
                    return;
                }

                try {

                    // check if package.json exists before executing npm
                    // otherwise it walks the directorys up till a package.json is found
                    // in the "worst case" this is the one from backend
                    statSync(path.join(req.folder, "package.json"));

                } catch (err) {

                    if (err.code === "ENOENT") {
                        res.json(req.item);
                    } else {
                        res.status(500).json({
                            error: err.message
                        });
                    }

                    return;

                }

                let npm = exec(`npm install --omit=dev`, {
                    env: {
                        ...process.env,
                        NODE_ENV: "production",
                    },
                    cwd: req.folder
                });

                if (process.env.NODE_ENV === "development") {
                    npm.stdout.pipe(process.stdout);
                    npm.stderr.pipe(process.stderr);
                }

                npm.once("exit", (code) => {
                    if (code === 0 || code === 254) {

                        res.json(req.item);

                    } else {

                        res.status(400).json({
                            error: "npm could not install dependencies",
                            details: `npm exit code ${code}`
                        });

                    }
                });

            }

            // trigger closing pipeline below
            tar.stdin.end();

        });

        if (process.env.NODE_ENV === "development") {
            tar.stdout.pipe(process.stdout);
            tar.stderr.pipe(process.stderr);
        }

        pipeline(req, tar.stdin, (err) => {
            if (err && !res.headersSent) {

                res.status(500).json({
                    error: err.message
                });

            }
        });

    });

    router.delete("/:_id/files", variables, async (req, res) => {
        try {

            //let p = path.resolve(process.cwd(), "plugins", req.item.uuid);
            for (let file of await fs.readdir(req.folder)) {
                await fs.rm(path.join(req.folder, file), {
                    recursive: true
                });
            }

            res.json(req.item);

        } catch (err) {

            res.status(500).json({
                error: err.message,
                stack: err.stack
            });

        }
    });

    router.post("/:_id/start", async (req, res) => {
        try {

            await req.item.start();
            res.json(req.item);

        } catch (err) {

            res.status(500).json({
                error: err.message,
                stack: err.stack
            });

        }
    });

    router.post("/:_id/stop", async (req, res) => {
        try {

            await req.item.stop();
            res.json(req.item);

        } catch (err) {

            res.status(500).json({
                error: err.message,
                stack: err.stack
            });

        }
    });

};