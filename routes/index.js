const express = require("express");
const bodyParser = require("body-parser");

const C_PLUGINS = require("../components/plugins");
const C_ROOMS = require("../components/rooms");
const C_DEVICES = require("../components/devices");
const C_ENDPOINTS = require("../components/endpoints");
const C_VAULT = require("../components/vault");
const C_SCENES = require("../components/scenes");
const C_SSDP = require("../components/ssdp");
const C_STORE = require("../components/store");
const C_USERS = require("../components/users");
const C_WEBHOOKS = require("../components/webhooks");
const C_MQTT = require("../components/mqtt");
const C_MDNS = require("../components/mdns");

// Remove due to issue #273
//const { encode } = require("../helper/sanitize");
//const iterate = require("../helper/iterate");

// add logger for http, fix #409
const logger = require("../system/logger/index.js");
const log = logger.create("http");

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


const app = express();
const auth = express.Router();
const api = express.Router();
const logs = express.Router();
const about = express.Router();
//const system = express.Router();

// https://expressjs.com/en/guide/behind-proxies.html
app.set("trust proxy", [
    "loopback",
    "linklocal",
    "uniquelocal"
]);

// fix #409
// add logging for http requests
app.use((req, res, next) => {

    // log basic http requests, do not reveal any senstive information
    // thats why "req.path" is used instead of "req.url"
    log.debug(`${req.ip} - [${req.method}] ${req.path}`);

    // log verbose requests
    // this may reveal senstive informations like tokens or cookies
    log.verbose(JSON.stringify({
        query: req.query,
        params: req.params,
        headers: req.headers
    }));

    next();

});

app.use(bodyParser.json({
    limit: (Number(process.env.API_LIMIT_SIZE) * 1024)  // default to 25, (=25mb)
}));

// mount api router    
app.use("/api", api);

// mount auth router
app.use("/auth", auth);
require("./router.auth.js")(app, auth);

// mount logs router under /api
// TODO move to /system/logs
api.use("/logs", logs);
require("./router.api.logs.js")(app, logs);

// mount logs router under /api
// TODO remove
api.use("/about", about);
require("./router.api.about.js")(app, about);

//app.use("/system", system);
//require("./router.system.notifications.js")(app, system);


// ensure that all requests to /api are authenticated
// req.user = User item from component user
require("./auth-handler.js")(C_USERS, api);

// serailize api input fields
api.use((req, res, next) => {

    /*            
    // HTTP header should be set only for PUT and POST requests. So it can be ignored completly?!
    if (!req.headers["content-type"]?.includes("application/json")) {
        return res.status(415).end();
    }
    */

    // strip out any keys that start with "$"
    req.body = sanitize(req.body);

    // sanitze api input fields?
    /*
    // removed, breaks endpoints command payload
    // see #273
    if (!(process.env.API_SANITIZE_INPUT === "true" && req.body)) {
        return next();
    }
    */

    // patch/override sanitized object
    /*
    // removed, breaks endpoints command payload
    // see #273
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
    */

    next();

});


// https://learning.postman.com/docs/writing-scripts/test-scripts/


// define sub router for api/component routes
const pluginsRouter = express.Router();
const roomsRouter = express.Router();
const devicesRouter = express.Router();
const endpointsRouter = express.Router();
const vaultRouter = express.Router();
const scenesRouter = express.Router();
const eventsRouter = express.Router();
const ssdpRouter = express.Router();
const storeRouter = express.Router();
const usersRouter = express.Router();
const webhooksRouter = express.Router();
const mqttRouter = express.Router();
const mdnsRouter = express.Router();

// http://127.0.0.1/api/plugins
api.use("/plugins", pluginsRouter);
require("./rest-handler.js")(C_PLUGINS, pluginsRouter);
require("./router.api.plugins.js")(app, pluginsRouter);

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
api.use("/scenes", scenesRouter);
require("./rest-handler.js")(C_SCENES, scenesRouter);
require("./router.api.scenes.js")(app, scenesRouter);

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
require("./router.api.store.js")(app, storeRouter);

// http://127.0.0.1/api/users
api.use("/users", usersRouter);
require("./rest-handler.js")(C_USERS, usersRouter);
//require("./router.api.users.js")(app, vaultRouter);

// http://127.0.0.1/api/webhooks
api.use("/webhooks", webhooksRouter);
require("./router.api.webhooks.js")(app, webhooksRouter);
require("./rest-handler.js")(C_WEBHOOKS, webhooksRouter);

// http://127.0.0.1/api/mqtt
api.use("/mqtt", mqttRouter);
require("./router.api.mqtt.js")(app, mqttRouter);
require("./rest-handler.js")(C_MQTT, mqttRouter);

// http://127.0.0.1/api/mdns
api.use("/mdns", mdnsRouter);
require("./router.api.mdns.js")(app, mdnsRouter);
require("./rest-handler.js")(C_MDNS, mdnsRouter);

// NOTE: Drop this?!
api.use((req, res) => {
    res.status(404).end();
    /*
    res.status(404).json({
        error: "Hmm... :/ This looks not right.",
        message: `Url/endpoint "${req.url}" not found"`
    });
    */
});


module.exports = app;