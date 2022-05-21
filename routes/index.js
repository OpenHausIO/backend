const express = require("express");
const bodyParser = require("body-parser");

const C_PLUGINS = require("../components/plugins");
const C_ROOMS = require("../components/rooms");
const C_DEVICES = require("../components/devices");
const C_ENDPOINTS = require("../components/endpoints");
const C_VAULT = require("../components/vault");
//const C_SCENES = require("../components/scenes");
const C_SSDP = require("../components/ssdp");
const C_STORE = require("../components/store");
const C_USERS = require("../components/users");

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
    const logs = express.Router();

    app.use(bodyParser.json({
        limit: (Number(process.env.API_LIMIT_SIZE) * 1024)  // default to 25, (=25mb)
    }));


    // mount api router
    app.use("/auth", auth);
    app.use("/api", api);


    //require("./router.auth.js")(app, auth);


    // mount logs router under /api
    api.use("/logs", logs);
    require("./router.logs.js")(app, logs);


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
                // ignore device key in settings
                // see #127, currently i have no petter idea
                // be sure that we only ignore the device properety in the settings object
                if (type === "string" && !(key === "device" && req.body?.interfaces?.some(o => o?.settings?.device === value))) {
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
        const ssdpRouter = express.Router();
        const storeRouter = express.Router();
        const usersRouter = express.Router();

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

        // http://127.0.0.1/api/ssdp
        api.use("/ssdp", ssdpRouter);
        require("./router.api.ssdp.js")(app, ssdpRouter);
        require("./rest-handler.js")(C_SSDP, ssdpRouter);

        // http://127.0.0.1/api/store
        api.use("/store", storeRouter);
        require("./rest-handler.js")(C_STORE, storeRouter);

        // http://127.0.0.1/api/users
        api.use("/users", usersRouter);
        require("./rest-handler.js")(C_USERS, usersRouter);
        //require("./router.api.users.js")(app, vaultRouter);

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