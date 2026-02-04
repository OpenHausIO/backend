const path = require("path");
const { pipeline } = require("stream");
const { spawn } = require("child_process");
const process = require("process");
const fs = require("fs/promises");
const { statSync, readFileSync } = require("fs");
const { createConnection } = require("net");
const os = require("os");
const http = require("http");
const readline = require("readline");

const { MANIFESTS } = require("../components/plugins/class.httpServer.js");
const C_PLUGINS = require("../components/plugins");
const { logger } = C_PLUGINS;

const { EventEmitter } = require("events");
const throttle = require("../helper/throttle.js");
const emitter = new EventEmitter();

const progress = {
    precent: 0,
    completed: false
};

let contentLength = 0;
let receivedBytes = 0;
let resolvedCount = 0;
let totalPackages = 0;

let uploadProgress = 0;
let installProgress = 0;

function flattenDependencies(tree, result = new Set(), isDev = false) {
    if (!tree) return result;

    for (const [name, info] of Object.entries(tree)) {
        if (info.dev) continue; // devDependency ignorieren
        const key = `${name}@${info.version}`;
        result.add(key);
        if (info.dependencies) {
            flattenDependencies(info.dependencies, result, isDev);
        }
    }
    return result;
}

const updateProgress = throttle(() => {

    if (process.env.NODE_ENV === "development") {
        process.stdout.write(`\rProgress: ${progress.precent}%`);
    }

    if (!progress.completed) {
        emitter.emit("progress");
    }

}, 100);

function totalProgress(uploadPercent, installPercent) {

    const phase1Weight = 0.2; // 20% des Gesamtfortschritts
    const phase2Weight = 0.8;

    const total = (uploadPercent / 100) * phase1Weight + (installPercent / 100) * phase2Weight;
    progress.precent = Number((total * 100).toFixed(2)); // 0-100%

    process.stdout.write(`\rProgress: ${progress.precent}%`);

    if (progress.precent >= 100) {

        progress.completed = true;

        setImmediate(() => {
            emitter.emit("complete");
        });

    }

    updateProgress();

}

function initProgress(req) {

    contentLength = parseInt(req.headers["content-length"]) || 0;

    receivedBytes = 0;
    resolvedCount = 0;
    totalPackages = 0;

    uploadProgress = 0;
    installProgress = 0;

    progress.precent = 0;
    progress.completed = false;

    const chunkHandler = (chunk) => {
        receivedBytes += chunk.length;
        uploadProgress = ((receivedBytes / contentLength) * 100).toFixed(2);
        totalProgress(uploadProgress, installProgress);
    };

    req.once("close", () => {
        //console.log("Incoming request closed, clenaup progress stuff");
        req.off("data", chunkHandler);
    });

    req.on("data", chunkHandler);

}

module.exports = (app, router) => {

    // catch delete request
    // stop plugin worker thread before deleting item
    // NOTE: Why not pre delete/remove hook?
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

    // see components/plugins/class.httpServer.js:
    // `.definePlugin()`/`.addManifest()`
    router.get("/manifests", (req, res) => {
        res.json(Array.from(MANIFESTS));
        //res.json([])
    });

    router.get("/progress", (req, res) => {
        //console.log("/progress called");

        /*
        if (!progress.locked) {
            return res.status(102).end();
        }
        */

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

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

    router.put("/:_id/files", variables, (req, res) => {

        if (parseInt(req.headers?.["content-length"] || 0) <= 0) {
            return res.status(400).json({
                error: "Invalid upload size."
            });
        }

        initProgress(req, res);

        //let p = path.resolve(process.cwd(), "plugins", req.item.uuid);
        // who not tar-stream here used?!
        //let tar = exec(`tar vzxf - -C ${req.folder}`);
        let tar = spawn(process.env.BIN_PATH_TAR, [
            "vzxf",
            "-",
            "--no-same-owner",
            "-C",
            req.folder
        ]);

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
                    return res.json(req.item);
                }

                try {

                    // check if package.json exists before executing npm
                    // otherwise it walks the directorys up till a package.json is found
                    // in the "worst case" this is the one from backend
                    statSync(path.join(req.folder, "package.json"));
                    statSync(path.join(req.folder, "package-lock.json"));

                    // calculate roughtly the needed packages count
                    // npm v7+ format
                    //totalPackages = Object.keys(lockFile.packages || {}).filter(k => k !== "").length;
                    //totalPackages = Object.keys(lockFile.packages || {}).filter(key => key !== "").length;
                    const lockFile = JSON.parse(readFileSync(path.join(req.folder, "package-lock.json"), "utf8"));
                    totalPackages = Array.from(flattenDependencies(lockFile.packages)).length;

                } catch (err) {

                    logger.warn(err, `Could not check package/-lock.json`);

                    if (err.code === "ENOENT") {

                        logger.warn("package/-lock.json not found, nothing to install - its ok!");

                        res.json(req.item);

                    } else {

                        logger.error(err, "Parsing error, could not read/parse package-lock.json");

                        res.status(500).json({
                            error: err.message
                        });

                    }

                    // package/parsing error
                    // skip dependencies installation
                    req.install = false;
                    totalProgress(100, 100);

                }

                if (req.install) {
                    if (process.env.PLUGIN_INSTALLER === "pnpm") {

                        const pnpm = spawn(process.execPath, [
                            `${process.cwd()}/node_modules/.bin/pnpm`,
                            "install",
                            "--reporter=ndjson",
                            "--loglevel=debug"
                        ], {
                            cwd: req.folder,
                            env: {
                                ...process.env,
                                "NODE_ENV": "production"
                            }
                        });

                        pnpm.on("exit", code => {
                            if (code === 0) {

                                //console.log("Installation finished");

                                totalProgress(100, 100);
                                res.json(req.item);

                            } else {

                                //console.log("Installation error, exit code not 0", code);
                                res.status(400).json({
                                    error: "npm could not install dependencies",
                                    details: `npm exit code ${code}`
                                });

                            }
                        });

                        readline.createInterface({
                            input: pnpm.stdout
                        }).on("line", (line) => {
                            try {

                                let { name } = JSON.parse(line);

                                if (name === "pnpm:_dependency_resolved") {
                                    resolvedCount++;
                                    installProgress = Math.min((resolvedCount / totalPackages) * 100, 100);
                                    totalProgress(uploadProgress, installProgress);
                                }

                            } catch {

                                // ignore json parsing error

                            }
                        });

                    } else if (process.env.PLUGIN_INSTALLER === "npm") {

                        let npm = spawn(process.env.BIN_PATH_NPM, [
                            "install",
                            "--omit=dev"
                        ], {
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

                                // npm does not support to extrat installation progress in any way
                                // just set 100 when completed
                                totalProgress(uploadProgress, 100);

                                res.json(req.item);

                            } else {

                                res.status(400).json({
                                    error: "npm could not install dependencies",
                                    details: `npm exit code ${code}`
                                });

                            }
                        });

                    } else {

                        logger.warn(`Plugin installer "${process.env.PLUGIN_INSTALLER}" unsuportted`);

                        res.status(500).json({
                            error: `Plugin installer "${process.env.PLUGIN_INSTALLER}" unsuportted`
                        });

                    }
                }

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

        let url = req.url.replace(`/${req.params._id}/proxy`, "/");
        url = path.normalize(url);

        let sock = path.join(os.tmpdir(), `OpenHaus/plugins/${req.item.uuid}.sock`);

        if (req.headers.upgrade?.toLowerCase() === "websocket" && req.headers.connection?.toLowerCase().includes("upgrade")) {

            // raw socket tunnel
            const client = createConnection(sock, () => {

                client.write(`GET ${url} HTTP/1.1\r\n`);

                for (let key in req.headers) {
                    client.write(`${key}: ${req.headers[key]}\r\n`);
                }

                client.write("\r\n");

                client.pipe(res.socket);
                req.socket.pipe(client);

            });

            client.on("error", (err) => {
                logger.warn(err, "Proxy request error");
                res.status(502).end("Bad Gateway");
            });

        } else {

            // normale HTTP
            // with path rewrite

            const proxyReq = http.request({
                socketPath: sock,
                path: url,
                method: req.method,
                headers: req.headers,
            }, proxyRes => {

                if (proxyRes?.headers?.location) {

                    const originalLocation = proxyRes.headers.location;

                    // reqire only absolute path/redirects
                    if (originalLocation.startsWith("/")) {
                        const basePath = `/api/plugins/${req.params._id}/proxy`;
                        proxyRes.headers.location = path.posix.join(basePath, originalLocation);
                    }

                }

                res.writeHead(proxyRes.statusCode, proxyRes.headers);
                proxyRes.pipe(res);

            });

            req.pipe(proxyReq);

            proxyReq.on("error", (err) => {
                logger.warn(err, "Proxy request error");
                res.status(502).end("Bad Gateway");
            });

        }

    });

};