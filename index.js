const path = require("path");
const http = require("http");
const readline = require("readline");
const process = require("process");
const mongodb = require("mongodb");
const pkg = require("./package.json");
const { exec } = require("child_process");

// https://askubuntu.com/a/577317/1034948
if (process.execArgv.includes("--inspect")) {
    try {
        exec("chromium-browser & sleep 1 && xdotool type 'chrome://inspect' && xdotool key Return");
    } catch (err) {
        console.error("Could not open chromium browser");
    }
}



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
    BCRYPT_SALT_ROUNDS: "12",
    PASSWORD_MIN_LENGTH: "16",
    DATABASE_HOST: "127.0.0.1",
    DATABASE_PORT: "27017",
    DATABASE_NAME: "OpenHaus",
    DATABASE_TIMEOUT: "5", // FIXME: Does nothing in db config
    DATABASE_URL: "",
    HTTP_PORT: "8080",
    HTTP_ADDRESS: "0.0.0.0",
    LOG_PATH: path.resolve(process.cwd(), "logs"),
    LOG_LEVEL: "verbose",
    LOG_DATEFORMAT: "yyyy.mm.dd - HH:MM.ss.l",
    LOG_SUPPRESS: "false",
    LOG_TARGET: "",
    NODE_ENV: "production",
    STARTUP_DELAY: "0",
    COMMAND_RESPONSE_TIMEOUT: "2000",
    API_SANITIZE_INPUT: "true",
    API_LIMIT_SIZE: "25",
    DEBUG: "",
    GC_INTERVAL: ""
}, env.parsed, process.env);



// make it impossible to change process.env
// https://github.com/nodejs/node/issues/30806#issuecomment-562133063
process.env = Object.freeze({ ...process.env });

// this does not preserve deletions
/*
// throws delete error for pacakge "debug"
// https://javascript.info/proxy
*/
/*
process.env = new Proxy({ ...process.env }, {
    set: function () {
        throw Error(`Illegal set operation!\r\nIts prohibited to change the process.env object`);
    },
    deleteProperty: (traget, prop) => {
        if (prop !== "DEBUG") {
            throw Error(`Illegal delete operation!\r\nIts prohibited to change the process.env object`);
        }
    },
    preventExtensions: () => {
        throw Error(`Illegal extension operation!\r\nIts prohibited to change the process.env object`);
    }
});
*/




if (process.env.NODE_ENV === "development") {
    console.clear();
}


// init feedback
//process.stdout.write("\033c"); // use console.clear()?!
// https://stackoverflow.com/a/41407246/5781499
console.log(`Starting OpenHaus ${(process.env.NODE_ENV !== "production" ? `in "\x1b[4m${process.env.NODE_ENV}\x1b[0m" mode ` : "")}v${pkg.version}...`);



//require("./system/shared_objects.js");
// TODO find other way.
// hits is uglay and hard to maintain
global.sharedObjects = {
    interfaceStreams: new Map(),
    interfaceServer: new Map(),
    interfaces: new Map()
};



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

        logger.verbose("Init Database...");
        let constr = process.env.DATABASE_URL;

        if (!process.env.DATABASE_URL) {
            constr = `mongodb://${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`;
        }

        // feedback
        logger.debug(`Connecting to "%s"...`, process.env.DATABASE_URL || constr);


        mongodb.MongoClient.connect(constr, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
            connectTimeoutMS: Number(process.env.DATABASE_TIMEOUT) * 1000, // TODO: fix, does nothing
            socketTimeoutMS: Number(process.env.DATABASE_TIMEOUT) * 1000 // TODO: Fix, does nothing
        }, (err, client) => {

            if (err) {
                logger.error(err, "Could not connect to database");
                return reject(err);
            }

            // monky patch db instance
            // use this instance in other files
            //mongodb.client = client.db(process.env.DATABASE_NAME);
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

        logger.verbose("Init components...");

        const componentNames = [
            "rooms",
            "users",
            "devices",
            "endpoints",
            //"scenes",
            "plugins"
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

                let component = require(`./components/${name}/index.js`);

                component.events.on("ready", () => {

                    componentConter += 1;

                    logger.debug(`Component "${name}" ready to use. (${componentConter}/${componentNames.length})`);

                    if (componentConter === componentNames.length) {
                        logger.info(`All ${componentNames.length} Components ready`);
                        resolve();
                    }

                });

                component.events.on("error", (err) => {
                    logger.error(err, `Component "${name}" error!`);
                });

            } catch (err) {

                console.error(err);
                process.exit(800);

            }
        });

    });
};


const init_http = () => {
    return new Promise((resolve, reject) => {

        logger.verbose("Init http server...");

        let server = http.createServer();

        server.on("error", (err) => {
            logger.error(err, `Could not start http server: ${err.message}`);
            reject(err);
        });

        server.on("listening", () => {

            let addr = server.address();
            logger.info(`HTTP Server listening on http://${addr.address}:${addr.port}`);

            resolve();

        });


        require("./routes")(server);

        // bind/start http server
        server.listen(Number(process.env.HTTP_PORT), process.env.HTTP_ADDRESS);

    });
};


const kickstart = () => {
    try {

        logger.debug("Initzisalision done");


        //require("./test/endpoints");
        //require("./test/devices");
        //require("./test/plugins");
        //require("./test/scene"); // later

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
    init_db,
    init_components,
    init_http,
    kickstart
].reduce((cur, prev) => {
    return cur.then(prev).catch((err) => {

        console.log("ASDFASDFSADFSADf", err);

        // feedback
        logger.error(err, `Initzalisilni failed: ${err.message}`);

        // exit process
        process.exit(1000);

    });
}, starter).then(() => {

    logger.debug("Starting plugins...");

    require("./components/plugins").items.filter((obj) => {
        // TODO check for runlevel
        return obj.autostart && obj.enabled;
    }).forEach((plugin) => {
        try {

            logger.debug(`Start plugin "${plugin.name}" (${plugin.uuid})`);

            plugin.boot();

        } catch (err) {

            logger.error(err, `Could not boot plugin "${plugin.name}" (${plugin.uuid})`);

        }
    });

});