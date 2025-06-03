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


const BASE_PATH = path.join(process.cwd(), "./plugins");
const ALGORITHM = "aes-256-cbc";


module.exports = (router) => {

    router.post("/export", async (req, res) => {

        const pack = tar.pack();

        // NOTE: add error listener here?

        res.setHeader("content-type", "application/tar+gzip");
        res.setHeader("content-disposition", `attachment; filename="backend-${Date.now()}.tgz"`);

        if (req.query.encrypt == "true") {

            const key = crypto.randomBytes(32);
            const iv = crypto.randomBytes(16);

            res.setHeader("X-ENCRYPTION-KEY", key.toString("hex"));
            res.setHeader("X-ENCRYPTION-IV", iv.toString("hex"));

            const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
            pack.pipe(zlib.createGzip()).pipe(cipher).pipe(res);

        } else {

            pack.pipe(zlib.createGzip()).pipe(res);

        }


        if ((req.query?.includes?.includes("database") || (!req.query?.includes && true))) {
            for await (let collection of client.listCollections()) {

                // TODO: check/handle binary (serialized buffer objects)
                // > endpoint commands payload
                // > _id's should be mongodb object id's
                let data = (await client.collection(collection.name).find().toArray());
                pack.entry({ name: `database/${collection.name}.json` }, JSON.stringify(data));

            }
        }

        if ((req.query?.includes?.includes("plugins") || (!req.query?.includes && true))) {
            fs.readdirSync(BASE_PATH, {
                recursive: true
            }).filter((entry) => {

                // TODO: ignore .gitkeep file
                return !fs.statSync(path.join(BASE_PATH, entry)).isDirectory();

            }).map((entry) => {

                return [entry, fs.readFileSync(path.join(BASE_PATH, entry), "utf8")];

            }).forEach(([file, content]) => {

                pack.entry({ name: `plugins/${file}` }, content);

            });
        }


        if ((req.query?.includes?.includes("env") || (!req.query?.includes && true)) && fs.existsSync(path.join(process.cwd(), ".env"))) {

            // encode .env value as base64, so the are not human readable
            let content = fs.readFileSync(path.join(process.cwd(), ".env"), "utf8").split(EOL).map((line) => {

                if (req.query?.encode !== "true") {
                    return line;
                }

                let [key, value] = line.split("=");

                if (!value) {
                    return line;
                }

                return `${key}=${Buffer.from(value).toString("base64")}`;

            });

            pack.entry({ name: `.env` }, content.join(EOL));

        }

        pack.finalize();

    });


    router.post("/import", async (req, res) => {

        // set deafult resotre includes to "all"
        req.query.includes = req?.query?.includes || [
            "database",
            "plugins",
            "env"
        ];

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

        // NOTE: switch to `.once`?
        extract.on("error", (err) => {

            res.status(500).json({
                error: err.message,
                details: err,
                success: false
            });

            console.log("Terrible error", err);
            //process.exit(1);

        });


        // NOTE: switch to `.once`?
        extract.on("finish", () => {

            console.log("tar-stream finished");

            res.json({
                success: true,
                message: "Restart to apply changes!"
            });

        });


        if (req.query.encrypt == "true") {

            const key = Buffer.from(req.headers["x-encryption-key"], "hex");
            const iv = Buffer.from(req.headers["x-encryption-iv"], "hex");
            const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

            pipeline(req, decipher, zlib.createGunzip(), extract, (err) => {
                if (err) {

                    console.error("encrypted", err);

                }
            });

        } else {

            pipeline(req, zlib.createGunzip(), extract, (err) => {
                if (err) {

                    console.error("uncrypted", err);

                }
            });

        }


        extract.on("entry", async (header, stream, next) => {
            if (header.name.startsWith("database/") && req.query?.includes?.includes("database")) {

                console.log("restartoe database collection", header.name, header.size);

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

            } else if (header.name.startsWith("plugins/") && req.query?.includes?.includes("plugins")) {

                console.log("restroe plugin file", header.name, header.size);

                let name = header.name.replace("plugins/", "");

                fs.mkdirSync(path.dirname(path.join(BASE_PATH, name)), {
                    recursive: true
                });

                stream.pipe(fs.createWriteStream(path.join(BASE_PATH, name))).once("error", (err) => {
                    next(err);
                }).once("close", () => {
                    next();
                });

            } else if (header.name === ".env" && req.query?.includes?.includes("env")) {

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

};