const path = require("path");

module.exports = (logger) => {
    return () => {
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
                "vault",
                "webhooks",
                "mqtt",
                "mdns",
                "scenes"
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

                    let component = require(path.resolve(process.cwd(), `components/${name}/index.js`));

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
};