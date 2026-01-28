const crypto = require("crypto");
const zlib = require("zlib");
const path = require("path");
const fs = require("fs");
const { Writable, pipeline } = require("stream");
const { createInterface } = require("readline");
const { EOL } = require("os");
const { ObjectId } = require("mongodb");

const { client } = require("mongodb");
const tar = require("tar-stream");
const { InjectStream, ExtractStream } = require("../system/gzip");
const throttle = require("../helper/throttle.js");


const BASE_PATH = path.join(process.cwd(), "./plugins");
const ALGORITHM = "aes-256-cbc";

const { EventEmitter } = require("events");
const emitter = new EventEmitter();

const progress = {
    locked: false,
    precent: 0,
    completed: false,
    operation: null,
    timestamp: null
};

const updateProgress = throttle(() => {

    if (process.env.NODE_ENV === "development") {
        process.stdout.write(`\rProgress: ${progress.precent}%`);
    }

    if (!progress.completed) {
        emitter.emit("progress");
    }

}, 100);

function totalProgress(metadata) {

    progress.precent = Math.floor((metadata.processedFiles / metadata.totalFiles) * 100);
    progress.timestamp = Date.now();

    process.stdout.write(`\rProgress: ${progress.precent}% (${metadata.processedFiles}/${metadata.totalFiles})`);

    if (progress.precent >= 100) {

        progress.completed = true;

        setImmediate(() => {
            emitter.emit("complete");
        });

    }

    updateProgress();

}

function initProgress(req, res, operation) {

    progress.locked = true;
    progress.precent = 0;
    progress.completed = false;
    progress.operation = operation;

    if (operation === "export") {

        ["end", "close", "error"].forEach((event) => {
            res.once(event, () => {

                //console.log(`[iniProgress] req=${event}`);
                progress.locked = false;

            });
        });

    } else if (operation === "import") {

        ["end", "close", "error"].forEach((event) => {
            req.once(event, () => {

                //console.log(`[iniProgress] req=${event}`);
                progress.locked = false;

            });
        });

    } else {

        //console.log("Operation=%s not supported", operation);
        return res.status(400).json({
            error: `Operation "${operation}" not supported`
        });

    }

    return {
        totalFiles: 0,
        processedFiles: 0
    };

}


module.exports = (router) => {

    router.use((req, res, next) => {

        //console.log(`/system/export - locked=${progress.locked}`, progress);

        // block POST methods if locked
        // allow other methods e.g for SSE/progress
        if (req.method === "POST" && progress.locked) {

            if (req.query?.unlock === "true") {

                progress.locked = false;
                progress.operation = null;
                progress.precent = 0;
                progress.completed = false;

                return next();

            }

            return res.status(423).json({
                message: "Operation in progress",
                progress
            });

        }

        next();

    });


    router.post("/export", async (req, res) => {
        try {

            let aborted = false;

            // set socket timeout low to detecht aborted conenctions
            // no timeout listenner needed, this triggers "close" event
            // in initProgress helper function above which resets the lock
            req.socket.setTimeout(10000);
            req.socket.setKeepAlive(true, 1000);

            if (req.socket.setNoDelay) {
                req.socket.setNoDelay(true);
            }

            const metadata = initProgress(req, res, "export");
            const pack = tar.pack();

            const { includes = [
                "database",
                "plugins",
                "env"
            ] } = req.query;

            res.setHeader("content-type", "application/tar+gzip");
            res.setHeader("content-disposition", `attachment; filename="backend-${Date.now()}.tgz"`);

            const addEntry = (options, content) => {
                return new Promise((resolve) => {
                    try {

                        // drain loop if destroyed/aborted
                        if (aborted || pack.destroyed) {
                            return resolve();
                        }

                        const entry = pack.entry(options, content, (err) => {
                            if (err) {

                                //console.log("pack.entry() cb error:", err);
                                aborted = true;
                                resolve();

                            } else {

                                metadata.processedFiles++;
                                totalProgress(metadata);

                                resolve();

                            }
                        });

                        entry.on("error", () => {
                            aborted = true;
                            resolve();
                        });

                    } catch (err) {

                        //console.log("pack.entry() try error:", err);

                        // reset not needed, pipeline closes
                        //progress.locked = false;
                        aborted = true;
                        resolve();

                    }
                });
            };

            if (includes.includes("database")) {
                const collections = await client.listCollections().toArray();
                metadata.totalFiles += collections.length;
            }

            if (includes.includes("plugins")) {
                metadata.totalFiles += fs.readdirSync(BASE_PATH, {
                    recursive: true
                }).filter((entry) => {
                    return !fs.statSync(path.join(BASE_PATH, entry)).isDirectory();
                }).length;
            }

            if (includes.includes("env") && fs.existsSync(path.join(process.cwd(), ".env"))) {
                metadata.totalFiles += 1;
            }

            //console.log("Total files to process:", metadata.totalFiles);

            const injectStream = new InjectStream({
                md: JSON.stringify(metadata)
            });

            if (req.query.encrypt == "true") {

                const key = crypto.randomBytes(32);
                const iv = crypto.randomBytes(16);

                res.setHeader("X-ENCRYPTION-KEY", key.toString("hex"));
                res.setHeader("X-ENCRYPTION-IV", iv.toString("hex"));

                const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

                //pack.pipe(zlib.createGzip()).pipe(cipher).pipe(res);
                pipeline(pack, zlib.createGzip(), injectStream, cipher, res, () => {
                    aborted = true;
                    progress.locked = false;
                });

            } else {

                //pack.pipe(zlib.createGzip()).pipe(injectStream).pipe(res);
                pipeline(pack, zlib.createGzip(), injectStream, res, () => {
                    aborted = true;
                    progress.locked = false;
                });

            }

            if (includes.includes("database")) {
                for await (let collection of client.listCollections()) {

                    if (aborted) {
                        break;
                    }

                    let data = (await client.collection(collection.name).find().toArray());
                    await addEntry({ name: `database/${collection.name}.json` }, JSON.stringify(data));

                }
            }

            if (includes.includes("plugins")) {

                const pluginFiles = fs.readdirSync(BASE_PATH, {
                    recursive: true
                }).filter((entry) => {
                    return !fs.statSync(path.join(BASE_PATH, entry)).isDirectory();
                });

                for (const entry of pluginFiles) {

                    if (aborted) {
                        break;
                    }

                    const content = fs.readFileSync(path.join(BASE_PATH, entry), "utf8");
                    await addEntry({ name: `plugins/${entry}` }, content);

                }

            }

            if ((includes.includes("env")) && fs.existsSync(path.join(process.cwd(), ".env"))) {

                if (aborted) {
                    return;
                }

                let content = fs.readFileSync(path.join(process.cwd(), ".env"), "utf8").split(EOL).map((line) => {
                    if (req.query?.encode !== "true") {

                        return line;

                    } else {

                        let [key, value] = line.split("=");
                        if (!value) return line;
                        return `${key}=${Buffer.from(value).toString("base64")}`;

                    }
                });

                await addEntry({ name: `.env` }, content.join(EOL));

            }

            metadata.processedFiles = metadata.totalFiles;
            totalProgress(metadata);

            pack.finalize();

        } catch (err) {

            //console.log("Something really fucked up,", err);

            progress.locked = false;

        }
    });


    router.post("/import", async (req, res) => {

        const metadata = initProgress(req, res, "import");

        const { includes = [
            "database",
            "plugins",
            "env"
        ] } = req.query;

        // NOTE: this also deletes .gitkeep
        if (req.query?.truncate === "true") {
            for (let file of await fs.promises.readdir(BASE_PATH)) {
                await fs.promises.rm(path.join(BASE_PATH, file), {
                    recursive: true,
                    force: true
                });
            }
        }

        const extract = tar.extract();
        const extractStream = new ExtractStream();

        extractStream.once("header", ({ fields }) => {
            let { totalFiles } = JSON.parse(fields["md"].toString());
            metadata.totalFiles = totalFiles;
        });

        // NOTE: switch to `.once`?
        extract.on("error", (err) => {

            if (!res.headersSent) {
                res.status(500).json({
                    error: err.message,
                    details: err,
                    success: false
                });
            }

            progress.locked = false;

        });


        // NOTE: switch to `.once`?
        extract.on("finish", () => {
            //console.log("tar-stream finished");
        });


        if (req.query?.encrypt == "true") {

            const key = Buffer.from(req.headers["x-encryption-key"], "hex");
            const iv = Buffer.from(req.headers["x-encryption-iv"], "hex");
            const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

            pipeline(req, decipher, zlib.createGunzip(), extract, (err) => {
                if (err) {

                    console.error("encrypted", err);

                }
            });

        } else {

            //req.pipe(extractStream);

            pipeline(req, extractStream, zlib.createGunzip(), extract, (err) => {

                console.error("uncrypted pipeline finished", err);

                if (err) {

                    res.status(500).json({
                        error: err.message,
                        details: err,
                        success: false
                    });

                } else {

                    res.json({
                        success: true,
                        message: "Restart to apply changes!"
                    });

                }

                progress.locked = false;

            });

        }


        extract.on("entry", async (header, stream, done) => {

            const next = (err) => {
                if (err) {

                    console.error(err, "Abort?");
                    stream.destroy();

                } else {

                    metadata.processedFiles++;
                    totalProgress(metadata);

                    done(err);

                }
            };


            if (header.name.startsWith("database/") && includes.includes("database")) {

                //console.log("restartoe database collection", header.name, header.size);

                let chunks = [];
                let name = header.name.replace("database/", "");

                let writeable = new Writable({
                    write(chunk, enc, cb) {
                        chunks.push(chunk);
                        cb(null);
                    }
                });

                stream.pipe(writeable).on("close", async () => {

                    // TODO: check/handle binary (serialized buffer objects)
                    // > endpoint commands payload
                    // > _id's should be mongodb object id's                    
                    let documents = JSON.parse(Buffer.concat(chunks).toString()).map((item) => {
                        // NOTE: Hotfix for #506
                        item._id = new ObjectId(item._id);
                        return item;
                    });

                    // prevents bulk write error
                    // MongoInvalidArgumentError: Invalid BulkOperation, Batch cannot be empty
                    if (documents.length === 0) {
                        next();
                        return;
                    }

                    //console.log("collection name", path.basename(name, ".json"));

                    let collection = client.collection(path.basename(name, ".json"));

                    if (req.query?.truncate === "true") {
                        await collection.deleteMany({});
                    }

                    collection.insertMany(documents).catch((err) => {
                        if (err?.code === 11000 && req.query?.skipDuplicates === "true") {
                            next();
                        } else {
                            next(err);
                        }
                    }).then(() => {
                        next();
                    });

                });

            } else if (header.name.startsWith("plugins/") && includes.includes("plugins")) {

                //console.log("restroe plugin file", header.name, header.size);

                let name = header.name.replace("plugins/", "");

                fs.mkdirSync(path.dirname(path.join(BASE_PATH, name)), {
                    recursive: true
                });

                stream.pipe(fs.createWriteStream(path.join(BASE_PATH, name))).once("error", (err) => {
                    next(err);
                }).once("close", () => {
                    next();
                });

            } else if (header.name === ".env" && includes.includes("env")) {

                let envPath = path.join(process.cwd(), ".env");
                let fd = null;

                try {
                    if (req.query?.truncate === "true") {
                        fs.truncateSync(envPath, 0);
                    }
                } catch (err) {
                    // ignore
                } finally {
                    fd = fs.openSync(envPath, "w");
                }

                let rl = createInterface({
                    input: stream
                });

                rl.once("error", (err) => {
                    fs.closeSync(fd);
                    next(err);
                });

                rl.once("close", () => {
                    fs.closeSync(fd);
                    next();
                });

                rl.on("line", (line) => {

                    let [key, value] = line.split("=");

                    if (!key || !value || req.query?.decode !== "true") {
                        return fs.writeSync(fd, line + EOL);
                    }

                    line = `${key}=${Buffer.from(value, "base64").toString()}`;
                    fs.writeSync(fd, line + EOL);

                });

            } else {

                //console.log("unknown file prefix/name", header);
                next();

            }
        });

    });


    router.get("/progress", (req, res) => {

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        let onProgress = throttle(() => {
            res.write(`data: ${JSON.stringify(progress)}\n\n`);
        }, 100); //300

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

};