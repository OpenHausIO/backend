// init logger
// init components
// create wraper init func
// call plugin with init func
const { workerData, isMainThread, } = require("worker_threads");

if (isMainThread) {
    process.exit(123);
}

// "enable colors"
process.stdout.isTTY = true;
process.stderr.isTTY = true;

process.env = Object.freeze({ ...process.env });


//require("./system/shared.js");
//require("./system/dispatcher.js");

const logger = require("../../system/logger");
const log = logger.create(`plugins/${workerData.plugin.uuid}`);

const init_db = require("../..//system/init/init.database.js")(logger);
const init_components = require("../../system/init/init.components.js")(logger);

const Plugin = require("./class.plugin.js");



(async () => {
    try {

        let data = workerData.plugin;

        // init database & components
        await init_db();
        await init_components(data.intents);

        // feedback
        log.info("System init done");

        let plugin = new Plugin(data);
        await plugin.start();

        setInterval(() => {

            let mem = process.memoryUsage();
            console.group(Date.now());
            console.log(`RSS: ${Number(mem.rss / 1024 / 1024).toFixed(2)} MB`);
            console.log(`Heap Used: ${Number(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`);
            console.log(`External: ${Number(mem.external / 1024 / 1024).toFixed(2)} MB`);
            console.log();
            console.groupEnd();

        }, 30_000);

    } catch (err) {

        log.error(err, "Could not initalize system");
        process.exit(1);

    }
})();