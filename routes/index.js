const express = require("express");
const bodyParser = require("body-parser");

const C_PLUGINS = require("../components/plugins");
const C_USERS = require("../components/users");
const C_ROOMS = require("../components/rooms");
const C_DEVICES = require("../components/devices");
const C_ENDPOINTS = require("../components/endpoints");
//const C_SCENES = require("../components/scenes");

const { encode } = require("../helper/sanitize");
const iterate = require("../helper/iterate");

module.exports = (server) => {

    const app = express();
    const auth = express.Router();
    const api = express.Router();


    // mount api router
    app.use("/auth", auth);
    app.use("/api", api);


    api.use((req, res, next) => {

        console.log("Request headers", req.headers);

        next();

    });


    if (process.env.CORS_ENABLED === "true") {
        api.use((req, res, next) => {

            res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN);
            res.setHeader("Access-Control-Allow-Headers", ["X-AUTH-TOKEN", ...process.env.CORS_HEADERS.split(",")].join(","));
            res.setHeader("Access-Control-Allow-Methods", [process.env.CORS_METHODS.split(",")].join(","));

            next();

        });
    }


    require("./router.auth.js")(app, auth);


    // /api routes
    (() => {

        // use json as content-type
        api.use(bodyParser.json({
            limit: (Number(process.env.API_LIMIT_SIZE) * 1024)  // default to 25, (=25mb)
        }));


        // serailize api input fields
        // NOTE move into component?!
        api.use((req, res, next) => {

            // sanitze api input fields?
            if (!(process.env.API_SANITIZE_INPUT === "true" && req.body)) {
                return next();
            }

            // patch/override sanitized object
            req.body = iterate(req.body, (key, value, type) => {
                if (type === "string") {
                    return encode(value);
                } else {
                    return value;
                }
            });

            next();

        });


        // https://learning.postman.com/docs/writing-scripts/test-scripts/


        // define sub router for api/component routes
        const pluginsRouter = express.Router();
        const usesrRouter = express.Router();
        const roomsRouter = express.Router();
        const devicesRouter = express.Router();
        const endpointsRouter = express.Router();
        //const scenesRouter = express.Router();

        // http://127.0.0.1/api/plugins
        api.use("/plugins", pluginsRouter);
        require("./rest-handler.js")(C_PLUGINS, pluginsRouter);

        // http://127.0.0.1/api/users
        api.use("/users", (req, res, next) => {

            // store original method
            let json = res.json;

            // override .json
            res.json = (data) => {

                // iterate over each response, to censor password
                data = iterate(data, (key, value, type, parent) => {

                    // set password to null
                    if (key === "password") {
                        return null;
                    } else {
                        return value;
                    }

                    /* removes password
                    if (key === "password") {
                        delete parent.key;
                    } else {
                        return value;
                    }
                    */

                });

                json.call(res, data);

            };

            next();

        }, usesrRouter);
        require("./rest-handler.js")(C_USERS, usesrRouter);

        // http://127.0.0.1/api/rooms
        api.use("/rooms", roomsRouter);
        require("./rest-handler.js")(C_ROOMS, roomsRouter);

        // http://127.0.0.1/api/devices
        api.use("/devices", devicesRouter);
        require("./rest-handler.js")(C_DEVICES, devicesRouter);
        require("./router.api.devices.js")(app, devicesRouter);

        // http://127.0.0.1/api/endpoints
        api.use("/endpoints", endpointsRouter);
        require("./rest-handler.js")(C_ENDPOINTS, endpointsRouter);
        require("./router.api.endpoints.js")(app, endpointsRouter);

        // http://127.0.0.1/api/scenes
        //api.use("/scenes", scenesRouter);
        //require("./rest-handler.js")(C_SCENES, scenesRouter);
        //require("./router.api.scenes.js")(app, scenesRouter);


        api.use((req, res) => {
            res.status(404).json({
                error: "Hmm... :/ This looks not right.",
                message: `Url/endpoint "${req.url}" not found"`
            });
        });

        // https://expressjs.com/de/guide/error-handling.html
        app.use((error, req, res) => {
            console.error(error.stack);
            res.status(500).end();
        });

    })();

    // use express request handler
    server.on("request", app);

};