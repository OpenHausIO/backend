const path = require("path");
const http = require("http");
const fs = require("fs");
const readline = require("readline");
const process = require("process");
const mongodb = require("mongodb");
const pkg = require("./package.json");
const { exec } = require("child_process");
const uuid = require("uuid");


const env = require("dotenv").config({
    path: path.resolve(process.cwd(), ".env")
});


if (env.error) {
    env.parsed = {};
}


// default config 
// .env override defaults
// cli env override anything else
process.env = Object.assign({
    UUID: "",
    DATABASE_HOST: "127.0.0.1",
    DATABASE_PORT: "27017",
    DATABASE_NAME: "OpenHaus",
    //DATABASE_TIMEOUT: "5", // #8
    DATABASE_URL: "",
    DATABASE_WATCH_CHANGES: "false",
    DATABASE_UPDATE_DEBOUNCE_TIMER: "15",
    HTTP_PORT: "8080",
    HTTP_ADDRESS: "0.0.0.0",
    HTTP_SOCKET: "",
    LOG_PATH: path.resolve(process.cwd(), "logs"),
    LOG_LEVEL: "verbose",
    LOG_DATEFORMAT: "yyyy.mm.dd - HH:MM.ss.l",
    LOG_SUPPRESS: "false",
    LOG_TARGET: "",
    NODE_ENV: "production",
    STARTUP_DELAY: "0",
    COMMAND_RESPONSE_TIMEOUT: "2000",
    API_SANITIZE_INPUT: "true",
    API_LIMIT_SIZE: "25", // rename to "..._SIZE_LIMIT"?!
    API_AUTH_ENABLED: "true",
    API_WEBSOCKET_TIMEOUT: "5000",
    DEBUG: "",
    GC_INTERVAL: "",
    VAULT_MASTER_PASSWORD: "",
    VAULT_BLOCK_CIPHER: "aes-256-cbc",
    VAULT_AUTH_TAG_BYTE_LEN: "16",
    VAULT_IV_BYTE_LEN: "16",
    VAULT_KEY_BYTE_LEN: "32",
    VAULT_SALT_BYTE_LEN: "16",
    USERS_BCRYPT_SALT_ROUNDS: "12",
    USERS_JWT_SECRET: "",
    USERS_JWT_ALGORITHM: "HS384"
}, env.parsed, process.env);


// make it impossible to change process.env
// https://github.com/nodejs/node/issues/30806#issuecomment-562133063
process.env = Object.freeze({ ...process.env });


if (!process.env.UUID || !uuid.validate(process.env.UUID)) {
    throw new Error(`You need to set a valid "UUID" (v4) environment variable!`);
}


// https://askubuntu.com/a/577317/1034948
if (process.execArgv.includes("--inspect") && process.env.NODE_ENV === "development") {
    try {
        exec("chromium-browser & sleep 1 && xdotool type 'chrome://inspect' && xdotool key Return");
    } catch (err) {
        console.error("Could not open chromium browser");
    }
}


if (process.env.NODE_ENV === "development") {
    console.clear();
}


// init feedback
//process.stdout.write("\033c"); // use console.clear()?!
// https://stackoverflow.com/a/41407246/5781499
console.log(`Starting OpenHaus ${(process.env.NODE_ENV !== "production" ? `in "\x1b[4m${process.env.NODE_ENV}\x1b[0m" mode ` : "")}v${pkg.version}...`);



require("./system/shared.js");
// #9, see #86
// hits is uglay and hard to maintain
/*
global.sharedObjects = {
    interfaceStreams: new Map(),
    interfaceServer: new Map(),
    interfaces: new Map()
};
*/


// require logger as on of the first things
const logger = require("./system/logger");



if (process.env.NODE_ENV !== "production") {
    logger.warn("> OpenHaus runs not in production mode! (%s)", process.env.NODE_ENV);
}


if (process.env.GC_INTERVAL !== null && global.gc) {
    setInterval(() => {
        try {

            logger.debug("Garbage collection triggerd");

            global.gc();

        } catch (err) {

            logger.error(err, "Garbage collection failed!");

        }
    }, Number(process.env.GC_INTERVAL * 1000 || 1000 * 60 * 5));
}


const init_db = () => {
    return new Promise((resolve, reject) => {

        logger.debug("Init Database...");
        let constr = process.env.DATABASE_URL;

        if (!process.env.DATABASE_URL) {
            constr = `mongodb://${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`;
        }

        // feedback
        logger.verbose(`Connecting to "%s"...`, process.env.DATABASE_URL || constr);


        mongodb.MongoClient.connect(constr, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
            //connectTimeoutMS: Number(process.env.DATABASE_TIMEOUT) * 1000, // #9
            //socketTimeoutMS: Number(process.env.DATABASE_TIMEOUT) * 1000 // #9
        }, (err, client) => {

            if (err) {
                logger.error(err, "Could not connect to database");
                return reject(err);
            }

            // monky patch db instance
            // use this instance in other files
            //mongodb.client = client.db(process.env.DATABASE_NAME);
            mongodb.connection = client;
            mongodb.client = client.db();

            // feedback
            logger.info(`Connected to "%s"`, constr);

            resolve();

            client.on("error", (err) => {
                logger.error(err, "Could not connecto to databse: %s", err.message);
            });

            client.on("close", () => {
                process.exit(1000);
            });


        });

    });
};


const init_components = () => {
    return new Promise((resolve) => {

        logger.debug("Init components...");

        const componentNames = [
            "devices",
            "endpoints",
            "plugins",
            "rooms",
            "ssdp",
            "store",
            "users",
            "vault"
        ].sort(() => {

            // pseudo randomize start/init of components
            // https://stackoverflow.com/a/18650169/5781499
            return 0.5 - Math.random();

        });

        let componentConter = 0;
        //let counter = componentNames.length;


        // map over array
        // create from each promise
        // use Promise.all() ?
        // better/quicker start?
        componentNames.forEach((name) => {
            try {

                // this should be trace method
                logger.verbose(`Starting component "${name}"`);

                let component = require(`./components/${name}/index.js`);

                component.events.on("ready", () => {

                    componentConter += 1;

                    logger.debug(`Component "${name}" ready to use. (${componentConter}/${componentNames.length})`);

                    if (componentConter === componentNames.length) {
                        logger.info(`All ${componentNames.length} Components ready`);
                        resolve();
                    }

                });

                // see issue #53, this should fire:
                // the procces should not exit with a "unhandled execption"
                // the try/catch block is for unhandled exception, not for startup errors
                component.events.on("error", (err) => {
                    logger.error(err, `Component "${name}" error!`);
                    process.exit(1); // fix #53
                });

            } catch (err) {

                console.error(err, "Component error");
                process.exit(800);

            }
        });

    });
};


const init_http = () => {
    return new Promise((resolve, reject) => {

        logger.debug("Init http server...");

        const servers = [

            // http server for ip/port
            new Promise((resolve, reject) => {
                if (process.env.HTTP_ADDRESS !== "") {

                    let server = http.createServer();

                    server.on("error", (err) => {
                        logger.error(err, `Could not start http server: ${err.message}`);
                        reject(err);
                    });

                    server.on("listening", () => {

                        let addr = server.address();
                        logger.info(`HTTP Server listening on http://${addr.address}:${addr.port}`);

                        resolve(server);

                    });

                    require("./routes")(server);

                    // bind/start http server
                    server.listen(Number(process.env.HTTP_PORT), process.env.HTTP_ADDRESS);

                } else {
                    resolve();
                }
            }),

            // http server fo unix socket
            new Promise((resolve, reject) => {
                if (process.env.HTTP_SOCKET !== "") {

                    let server = http.createServer();

                    server.on("error", (err) => {

                        logger.error(err, `Could not start http server: ${err.message}`);
                        reject(err);

                    });

                    server.on("listening", () => {

                        logger.info(`HTTP Server listening on ${process.env.HTTP_SOCKET}`);

                        resolve(server);

                    });

                    require("./routes")(server);

                    try {

                        // cleanup 
                        fs.unlinkSync(process.env.HTTP_SOCKET);

                    } catch (err) {
                        if (err.code !== "ENOENT") {

                            reject(err);

                        }
                    } finally {

                        // bind/start http server
                        server.listen(process.env.HTTP_SOCKET);

                    }

                } else {
                    resolve();
                }
            })

        ];

        Promise.all(servers).then(() => {

            resolve();

        }).catch((err) => {

            logger.error(err, "Could not start http server(s)", err);

            reject(err);

        });

    });
};


const kickstart = () => {
    try {

        logger.info("Initzisalision done");


        //require("./test/endpoints");
        //require("./test/devices");
        //require("./test/plugins");
        //require("./test/vault");
        //require("./test/index");

        //console.log(sharedObjects.interfaceStreams)

    } catch (err) {

        console.log("FUCKI SCHIT HAPPEND IN USER CODE");
        console.error(err);

    }
};


const starter = new Promise((resolve) => {

    let delay = Number(process.env.STARTUP_DELAY);

    if (delay <= 0) {
        return resolve();
    }

    // init message
    process.stdout.write(`Wait ${delay}sec...`);

    let interval = setInterval(() => {

        delay -= 1;

        readline.cursorTo(process.stdout, 0);
        process.stdout.write(`Wait ${delay}sec...`);

        if (delay === 0) {
            clearInterval(interval);
            resolve();
        }

    }, 1000);


});




[
    init_db,            // phase 1
    init_components,    // phase 2
    init_http,          // phase 3
    kickstart
].reduce((cur, prev, i) => {
    return cur.then(prev).catch((err) => {

        // this does not get triggerd
        // needed? see issue #53

        // feedback
        logger.error(err, `Could not start. Error in startup phase ${i}; ${err.message}`);

        // exit process
        process.exit(1000);

    });
}, starter).then(() => {

    logger.debug("Starting plugins...");

    let bootable = require("./components/plugins").items.filter((obj) => {
        return obj.autostart && obj.enabled;
    });

    let started = 0;

    bootable.forEach((plugin) => {
        try {

            logger.verbose(`Start plugin "${plugin.name}" (${plugin.uuid})`);

            plugin.boot();

            started += 1;

        } catch (err) {

            logger.warn(`Could not boot plugin "${plugin.name}" (${plugin.uuid})`);

        }
    });

    if (bootable.length > started) {
        logger.debug(`${started}/${bootable.length} Plugins started (Someones are ignored! Check the logfiles.)`);
    } else {
        logger.debug(`${started}/${bootable.length} Plugins started`);
    }

    logger.info("Startup complete");

});