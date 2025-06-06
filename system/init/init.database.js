const mongodb = require("mongodb");
const { URL } = require("url");

module.exports = (logger) => {
    return () => {
        return new Promise((resolve, reject) => {

            logger.debug("Init Database...");

            let url = new URL(`mongodb://${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`);

            url.searchParams.set("authSource", process.env.DATABASE_AUTH_SOURCE); // admin
            url.searchParams.set("appName", process.env.DATABASE_APPNAME); // OpenHaus

            if (process.env.DATABASE_AUTH_USERNAME) {
                url.username = process.env.DATABASE_AUTH_USERNAME;
            }

            if (process.env.DATABASE_AUTH_PASSWORD) {
                url.password = process.env.DATABASE_AUTH_PASSWORD;
            }

            if (process.env.DATABASE_URL) {
                console.log("OVerride DATBAASE_URL");
                Object.assign(url, new URL(process.env.DATABASE_URL));
            }

            // feedback
            logger.verbose(`Connecting to "mongodb://${url.hostname}:${url.port}${url.pathname}"...`);


            mongodb.MongoClient.connect(url.toString(), {
                //useUnifiedTopology: true,  removed in mongodb@v4
                //useNewUrlParser: true, removed in mongodb@v4
                //connectTimeoutMS: Number(process.env.DATABASE_TIMEOUT) * 1000, // #9
                //socketTimeoutMS: Number(process.env.DATABASE_TIMEOUT) * 1000 // #9
            }).then((client) => {

                // monky patch db instance
                // use this instance in other files
                mongodb.client = client.db(process.env.DATABASE_NAME);
                mongodb.connection = client;


                client.on("error", (err) => {
                    logger.error(err, "Could not connecto to databse: %s", err.message);
                });

                client.on("close", () => {
                    process.exit(1000);
                });

            }).then(() => {

                // check credentials
                // test command
                return mongodb.client.stats();

            }).then(() => {

                // feedback
                logger.info(`Connected to "mongodb://${url.hostname}:${url.port}${url.pathname}"`);

                process.once("SIGINT", () => {
                    mongodb.connection.close(() => {
                        logger.info(`Connection closed from "mongodb://${url.hostname}:${url.port}${url.pathname}"`);
                    });
                });

                resolve();

            }).catch((err) => {

                logger.error(err, "Could not connecto to database");

                if (err?.code == 13) {
                    logger.error("Invalid database credentials!");
                }

                //mongodb.client.emit("error", err);
                reject(err);

            });

        });
    };
};