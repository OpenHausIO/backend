const path = require("path");
const { pipeline } = require("stream");
const { exec } = require("child_process");
const process = require("process");
const fs = require("fs/promises");
const { statSync } = require("fs");
const { createConnection } = require("net");
const os = require("os");
const { Transform } = require("stream");

const C_PLUGINS = require("../components/plugins");
const { logger } = C_PLUGINS;

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

    // catch delete request
    // stop plugin worker thread before deleting item
    if (process.env.WORKER_THREADS_ENABLED == "true") {
        router.delete("/:_id", async (req, res, next) => {
            try {

                // req.item is set from rest-handler router.param()
                // TODO: Make this optional e.g. via req.query
                // In the frontend then should a checkbox which sets it to true
                // when expert settings are disabled, there should be modal which asks to stop the plugin before delete
                // when enabled, delete anyway, but dont stop plugin, instead a 202 http code shoult be returned when the plugin is still running
                // where then the frontend notification changes and says "restart required, plugin still running" or so...
                if (req?.item?.started) {
                    await req.item.stop();
                }

            } catch (err) {

                // feedback
                logger.warn(err, "Could not stop plugin before delete, it may be still running. Restart the backend to apply changes");

            } finally {

                // foward to rest-handler.js
                next();

            }
        });
    }

    const variables = (req, res, next) => {

        // TODO: use process.env.<plugins location>
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

    router.all("/:_id/proxy(/*)?", (req, res) => {

        let { method, httpVersion, headers } = req;
        let url = req.url.replace(`/${req.params._id}/proxy`, "/");
        url = path.normalize(url);

        // TODO: configure path to sockets?
        let sock = path.join(os.tmpdir(), `OpenHaus/plugins/${req.item.uuid}.sock`);

        // TODO: implement leading/railing-slash error
        // FIXME: "connection=keep-alive" results in "Cannot read properties of null (reading 'server')" :
        /*
            at /home/marc/projects/OpenHaus/backend/routes/auth-handler.js:12:31
            at Layer.handle [as handle_request] (/home/marc/projects/OpenHaus/backend/node_modules/express/lib/router/layer.js:95:5)
            at trim_prefix (/home/marc/projects/OpenHaus/backend/node_modules/express/lib/router/index.js:328:13)
            at /home/marc/projects/OpenHaus/backend/node_modules/express/lib/router/index.js:286:9
            at Function.process_params (/home/marc/projects/OpenHaus/backend/node_modules/express/lib/router/index.js:346:12)
            at next (/home/marc/projects/OpenHaus/backend/node_modules/express/lib/router/index.js:280:10)
            at Function.handle (/home/marc/projects/OpenHaus/backend/node_modules/express/lib/router/index.js:175:3)
            at router (/home/marc/projects/OpenHaus/backend/node_modules/express/lib/router/index.js:47:12)
            at Layer.handle [as handle_request] (/home/marc/projects/OpenHaus/backend/node_modules/express/lib/router/layer.js:95:5)
            at trim_prefix (/home/marc/projects/OpenHaus/backend/node_modules/express/lib/router/index.js:328:13)
            
            Add req.socket.unpipe();?
        */

        logger.verbose(`[proxy] Incoming request: ${req.method} ${req.url}`, req.headers);


        const client = createConnection(sock, () => {

            // write http header first line
            client.write(`${method} ${url} HTTP/${httpVersion}\r\n`);

            // send http request headers to proxy target
            for (let key in headers) {
                if (key.toLowerCase() === "connection" && headers[key] !== "Upgrade") {

                    // override client connection header
                    // fix "Cannot read properties of null (reading 'server')" error above
                    // multiple/frequent requests result in the error above if "connection=keep-alive"
                    client.write("connection: close\r\n");

                } else {

                    // forward original header/value
                    client.write(`${key}: ${headers[key]}\r\n`);

                }
            }

            // sperate header&body
            client.write(`\r\n`);

            // TODO: toLowerCase() header keys
            if (req.headers["upgrade"] && req.headers["connection"]) {

                // handle websocket
                client.pipe(res.socket);
                req.socket.pipe(client);

            } else {

                // handle regular http
                client.pipe(res.socket);
                req.pipe(client);

            }

        });

        res.socket.once("error", (err) => {
            logger.error(err, "[proxy] Error on res.socket");
            client.destroy();
        });

        client.on("error", (err) => {
            logger.error(err, "[proxy] Error on client object");
            res.status(502)
            res.end("Bad Gateway");
        });

        client.once("end", () => {
            logger.verbose("[proxy] client socket ended");
            res.end();
            client.end();
        });

        req.on("error", () => {
            logger.error(err, "[proxy] Error on req object");
            client.end();
        });

        req.once("end", () => {
            logger.verbose("[proxy] req ended");
            client.end()
        });

    });


};