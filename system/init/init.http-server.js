const http = require("http");
const fs = require("fs");

module.exports = (logger) => {
    return () => {
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

                        server.on("close", () => {
                            logger.info(`HTTP Server closed on http://${process.env.HTTP_ADDRESS}:${process.env.HTTP_PORT}`);
                        });

                        require("../../routes/index.js")(server);

                        // bind/start http server
                        server.listen(Number(process.env.HTTP_PORT), process.env.HTTP_ADDRESS);

                    } else {
                        resolve();
                    }
                }),

                // http server for unix socket
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

                        server.on("close", () => {
                            logger.info(`HTTP Server closed on ${process.env.HTTP_SOCKET}`);
                        });

                        require("../../routes/index.js")(server);

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

            Promise.all(servers).then((servers) => {

                process.once("SIGINT", () => {
                    servers.forEach((server) => {
                        server.close();
                    });
                });

                resolve();

            }).catch((err) => {

                logger.error(err, "Could not start http server(s)", err);

                reject(err);

            });

        });
    };
};