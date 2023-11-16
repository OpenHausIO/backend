const mongodb = require("mongodb");
const { URL } = require("url");

module.exports = (logger) => {
    return () => {
        return new Promise((resolve, reject) => {

            logger.debug("Init Database...");

            let url = new URL(`mongodb://${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`);

            if (process.env.DATABASE_AUTH_USERNAME) {
                url.username = process.env.DATABASE_AUTH_USERNAME;
            }

            if (process.env.DATABASE_AUTH_USERNAME) {
                url.password = process.env.DATABASE_AUTH_PASSWORD;
            }

            if (process.env.DATABASE_URL) {
                console.log("OVerride DATBAASE_URL");
                Object.assign(url, new URL(process.env.DATABASE_URL));
            }

            // feedback
            logger.verbose(`Connecting to "mongodb://${url.hostname}:${url.port}${url.pathname}"...`);


            mongodb.MongoClient.connect(url.toString(), {
                useUnifiedTopology: true,
                useNewUrlParser: true,
                //connectTimeoutMS: Number(process.env.DATABASE_TIMEOUT) * 1000, // #9
                //socketTimeoutMS: Number(process.env.DATABASE_TIMEOUT) * 1000 // #9
            }, async (err, client) => {

                if (err) {
                    logger.error(err, "Could not connect to database");
                    return reject(err);
                }

                // monky patch db instance
                // use this instance in other files
                //mongodb.client = client.db(process.env.DATABASE_NAME);
                mongodb.connection = client;
                mongodb.client = client.db();


                client.on("error", (err) => {
                    logger.error(err, "Could not connecto to databse: %s", err.message);
                });

                client.on("close", () => {
                    process.exit(1000);
                });


                try {

                    // test authenticiation
                    // throws a error is auth is noc successfull
                    await mongodb.client.stats();

                    // feedback
                    logger.info(`Connected to "mongodb://${url.hostname}:${url.port}${url.pathname}"`);

                    process.once("SIGINT", () => {
                        mongodb.connection.close(() => {
                            logger.info(`Connection closed from "mongodb://${url.hostname}:${url.port}${url.pathname}"`);
                        });
                    });

                    resolve();

                } catch (err) {

                    if (err?.code == 13) {
                        logger.error("Invalid database credentials!");
                    }

                    client.emit("error", err);
                    reject(err);

                }


            });

        });
    };
};