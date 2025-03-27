const path = require("path");
const readline = require("readline");
const process = require("process");
const pkg = require("./package.json");
const { exec } = require("child_process");
const uuid = require("uuid");
const semver = require("semver");


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
    DATABASE_AUTH_SOURCE: "admin",
    DATABASE_APPNAME: "OpenHaus",
    HTTP_PORT: "8080",
    HTTP_ADDRESS: "0.0.0.0",
    HTTP_SOCKET: "/tmp/open-haus.sock",
    LOG_PATH: path.resolve(process.cwd(), "logs"),
    LOG_LEVEL: "info",
    LOG_DATEFORMAT: "yyyy.mm.dd - HH:MM.ss.l",
    LOG_SUPPRESS: "false",
    LOG_TARGET: "",
    NODE_ENV: "production",
    STARTUP_DELAY: "0",
    COMMAND_RESPONSE_TIMEOUT: "2000",
    API_SANITIZE_INPUT: "false", // breaks items payload, see #273
    API_LIMIT_SIZE: "25", // rename to "..._SIZE_LIMIT"?!
    API_AUTH_ENABLED: "false",
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
    USERS_JWT_ALGORITHM: "HS384",
    MQTT_BROKER_VERSION: "4",
    MQTT_CLIENT_ID: "OpenHaus",
    MQTT_PING_INTERVAL: "5000",
    CONNECT_TIMEOUT: "10000",
    HTTP_TRUSTED_PROXYS: "loopback"
}, env.parsed, process.env);


// make it impossible to change process.env
// https://github.com/nodejs/node/issues/30806#issuecomment-562133063
process.env = Object.freeze({ ...process.env });


if (!process.env.UUID || !uuid.validate(process.env.UUID) || process.env.UUID === "00000000-0000-0000-0000-000000000000") {
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


// implement #195
if (process.env.NODE_ENV === "production") {
    console.log = () => { };
}


require("./system/shared.js");
require("./system/dispatcher.js");
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


// see #471
if (!semver.satisfies(process.versions.node, pkg.engines.node)) {
    logger.warn(`> OpenHaus runs not on supported node.js version! (got: "%s", needed: "%s")`, process.versions.node, pkg.engines.node);
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


const init_db = require("./system/init/init.database.js")(logger);
const init_components = require("./system/init/init.components.js")(logger);
const init_http = require("./system/init/init.http-server.js")(logger);


// NOTE: Could/should be removed
// was only used in the early state of developing without the plugin component/system
/*
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
*/


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
    //kickstart
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

    // implement #245
    // keep the app running but log important stuff!
    if (process.env.NODE_ENV === "production") {

        process.on("unhandledRejection", (err) => {
            logger.error("Uncaught rejection catched!", err);
        });

        process.on("uncaughtException", (err) => {
            logger.error("Uncaught execption catched!", err);
        });

    }

    logger.debug("Starting plugins...");

    let bootable = require("./components/plugins").items.filter((obj) => {
        return obj.autostart && obj.enabled;
    });

    let started = 0;

    bootable.forEach((plugin) => {
        try {

            logger.verbose(`Start plugin "${plugin.name}" (${plugin.uuid})`);

            plugin.start();

            started += 1;

        } catch (err) {

            logger.error(err, `Could not boot plugin "${plugin.name}" (${plugin.uuid})`);

        }
    });

    if (bootable.length > started) {
        logger.warn(`${started}/${bootable.length} Plugins started (Check the previously logs)`);
    } else {
        logger.info(`${started}/${bootable.length} Plugins started`);
    }

    logger.info("Startup complete");

    // fix #435
    ["SIGINT", /*"SIGTERM", "SIGQUIT"*/].forEach((signal) => {
        process.once(signal, () => {

            logger.warn("Shuting down...");

        });
    });

});
