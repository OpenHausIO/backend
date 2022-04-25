const express = require("express");
const bodyParser = require("body-parser");

const C_PLUGINS = require("../components/plugins");
const C_ROOMS = require("../components/rooms");
const C_DEVICES = require("../components/devices");
const C_ENDPOINTS = require("../components/endpoints");
const C_VAULT = require("../components/vault");
//const C_SCENES = require("../components/scenes");

const { encode } = require("../helper/sanitize");
const iterate = require("../helper/iterate");

// copied from https://github.com/vkarpov15/mongo-sanitize
function sanitize(v) {
    if (v instanceof Object) {
        for (var key in v) {
            if (/^\$/.test(key)) {
                delete v[key];
            } else {
                sanitize(v[key]);
            }
        }
    }
    return v;
}

module.exports = (server) => {

    const app = express();
    const auth = express.Router();
    const api = express.Router();

    app.use(bodyParser.json({
        limit: (Number(process.env.API_LIMIT_SIZE) * 1024)  // default to 25, (=25mb)
    }));


    // mount api router
    app.use("/auth", auth);
    app.use("/api", api);


    // /api routes
    (() => {

        // use json as content-type
        /*
        api.use(bodyParser.json({
            limit: (Number(process.env.API_LIMIT_SIZE) * 1024)  // default to 25, (=25mb)
        }));
        */


        // serailize api input fields
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

            // strip out any keys that start with "$"
            req.body = sanitize(req.body);

            next();

        });


        // https://learning.postman.com/docs/writing-scripts/test-scripts/


        // define sub router for api/component routes
        const pluginsRouter = express.Router();
        const roomsRouter = express.Router();
        const devicesRouter = express.Router();
        const endpointsRouter = express.Router();
        const vaultRouter = express.Router();
        //const scenesRouter = express.Router();
        const eventsRouter = express.Router();

        // http://127.0.0.1/api/plugins
        api.use("/plugins", pluginsRouter);
        require("./rest-handler.js")(C_PLUGINS, pluginsRouter);

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

        // http://127.0.0.1/api/vaults
        api.use("/vault", vaultRouter);
        require("./rest-handler.js")(C_VAULT, vaultRouter);
        require("./router.api.vault.js")(app, vaultRouter);

        // http://127.0.0.1/api/scenes
        //api.use("/scenes", scenesRouter);
        //require("./rest-handler.js")(C_SCENES, scenesRouter);
        //require("./router.api.scenes.js")(app, scenesRouter);

        // http://127.0.0.1/api/events
        api.use("/events", eventsRouter);
        require("./router.api.events.js")(app, eventsRouter);


        api.use((req, res) => {
            res.status(404).json({
                error: "Hmm... :/ This looks not right.",
                message: `Url/endpoint "${req.url}" not found"`
            });
        });


    })();

    // use express request handler
    server.on("request", app);

};