const http = require("http");
const fs = require("fs");

module.exports = (logger) => {
    return () => {
        return new Promise((resolve, reject) => {

            logger.debug("Init http server...");

            // store active sockets from requests
            // see #345
            const sockets = new Set();

            const servers = [

                // http server for ip/port
                new Promise((resolve, reject) => {
                    if (process.env.HTTP_ADDRESS !== "") {

                        let server = http.createServer();

                        server.on("connection", (socket) => {

                            sockets.add(socket);

                            socket.on("close", () => {
                                sockets.delete(socket);
                            });

                        });

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

                        // NOTE: Route handler get required/create twice:
                        // instead, require router file global
                        // and pass/move the request handler here
                        // thus prevents to create 2 express apps for each server
                        // "routes/index.js" should export the express app
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

                        server.on("connection", (socket) => {

                            sockets.add(socket);

                            socket.on("close", () => {
                                sockets.delete(socket);
                            });

                        });

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

                        // NOTE: Route handler get required/create twice:
                        // instead, require router file global
                        // and pass/move the request handler here
                        // thus prevents to create 2 express apps for each server
                        // "routes/index.js" should export the express app
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

                    // see #345
                    // close all active http sockets/requests
                    for (const socket of sockets.values()) {
                        socket.destroy();
                    }

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