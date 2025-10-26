const { ServerResponse, Server } = require("http");
const path = require("path");
const os = require("os");
const fs = require("fs");
const express = require("express");
const Joi = require("joi");

const MANIFESTS = new Set();

const manifestSchema = Joi.object({
    name: Joi.string().required(),
    icon: Joi.string().required(),
    src: Joi.string().required()
});

module.exports = class httpServer extends Server {

    static kServer = Symbol("kServer");
    static kHandler = Symbol("kHandler");
    static kPlugin = Symbol("kPlugin");
    static kApp = Symbol("kApp");
    static MANIFESTS = MANIFESTS;

    constructor(plugin, options, handler) {

        if (!handler && options instanceof Function) {
            handler = options;
            options = {};
        }

        super(options);

        this.options = Object.assign({
            autostart: true,
            timeout: 5000
        }, options);

        let { logger } = httpServer.scope;

        logger.debug(`httpServer() called, autostart=${this.options.autostart}`);

        //let server = createServer();
        let server = this;
        let sock = path.join(os.tmpdir(), `OpenHaus/plugins/${plugin.uuid}.sock`);

        server.timeout = this.options.timeout;
        server.requestTimeout = this.options.timeout;
        server.setTimeout(this.options.timeout);

        this[httpServer.kApp] = express();
        this[httpServer.kServer] = server;
        this[httpServer.kHandler] = handler;
        this[httpServer.kPlugin] = plugin;

        fs.mkdirSync(path.dirname(sock), {
            recursive: true,
            force: true
        });

        fs.rmSync(sock, {
            force: true
        });

        server.once("close", () => {

            logger.info(`HTTP Server closed on ${sock}`);

            fs.rmSync(sock, {
                force: true
            });

            logger.debug(`Socket "${sock}" deleted`);

        });

        server.on("error", (err) => {
            logger.warn(err, "HTTP Server error");
        });

        if (this.options.autostart) {
            server.listen(sock, (err) => {
                if (err) {

                    logger.error(err, `Could not start HTTP Server on ${sock}`);

                } else {

                    logger.debug(`HTTP Server listening on ${sock}`);

                }
            });
        }

        // handle http request (if no one else wants to)
        server.on("request", (req, res) => {

            // this fixes if a users register a custom request handler
            // otherwise "Cannot set headers after they are sent to the client" or other shit can happen
            if (server.listeners("request").length > 1) {
                return;
            }

            // tell the client connection will be closed
            // "keep-alive" breaks the proxy
            // see comment in "router.api.plugins.js" -> "FIXME: "connection=keep-alive"""
            //res.setHeader("connection", "close");
            //res.removeHeader("X-Powered-By");

            Reflect.apply(handler ?? this[httpServer.kApp], this, [
                req,
                res
            ]);

        });

        // handle websocket upgrade (if no one else wants to)
        server.on("upgrade", (req, socket) => {

            // this fixes if a users register a custom request handler
            // otherwise the second upgrade handler cannot proceed with the upgrade
            // e.g. node-red register one for the admin-ui & websocket nodes
            if (server.listeners("upgrade").length > 1) {
                return;
            }

            let res = new ServerResponse(req);
            res.assignSocket(socket);

            res.on("finish", () => {
                res.socket.destroy();
            });

            Reflect.apply(this[httpServer.kApp], this, [
                req,
                res
            ]);

        });

        process.on("SIGINT", () => {
            server.closeAllConnections();
            server.close();
        });

    }

    addManifest(obj) {

        let { error, value } = manifestSchema.validate(obj);

        if (error) {
            let { logger } = httpServer.scope;
            // NOTE: switch to logger.warn?
            logger.error(error, `Manifest validation failded.`);
            throw new Error(error);
        }

        MANIFESTS.add(value);

    }

    /*

    // the code below was used before the server.listeners("upgarde"|"request") trickt
    // keep them or drop them, beacause you can reqigster event listners directly?

    setRequestHandler(handler) {
        return this[httpServer.kApp].use(handler);
    }


    // TODO: Check if:
    // req.socket === upgrade socket
    // res.socket === upgrade socket
    // req.socket ==== res.socket
    handleWebSocket(handler) {
        this[httpServer.kServer].on("upgrade", (req, socket) => {
            if (handler && handler instanceof Function) {

                handler(req, socket);

            } else {

                let res = new ServerResponse(req);
                res.assignSocket(socket);

                res.on("finish", () => {
                    res.socket.destroy();
                });

                Reflect.apply(this[httpServer.kApp], this, [
                    req,
                    res
                ]);

            }
        });
    }
    */

    /*
    // the idea behind this was that the frontend fetches the "plugin manifestes"
    // and loads them/execute them
    // just a quick idea/not used anyqhere - keep this as reference
    // could also be used to display link/navigation item, e.g. like the node-red proxied admin ui
    definePlugin(obj) {

        // obj = {};
        // obj.root = process.cwd()/plugins/<uuid>/public
        // obj.entry = "index.js" (/api/plugins/<_id>/proxy/index.js)
        //return express instance?

        let plugin = this[httpServer.kPlugin];

        obj = Object.assign({
            // TODO: make path configurable via env
            root: path.join(process.cwd(), "plugins", plugin.uuid, "public"),
            entry: "main.js",
            components: [],
            options: {}
        }, obj);


        let app = express();

        let pub = express.static(obj.root, {
            //...obj.options
        });

        app.use("/static", pub);


        // works!
        this[httpServer.kApp].use(app)


        // "register" entry point 
        MANIFESTS.add({
            name: obj.name,
            url: `/api/plugins/${plugin._id}/proxy/static/${obj.entry}`,
            components: obj.components.map((file) => {
                return `/api/plugins/${plugin._id}/proxy/static/${file}`;
            })
        });


        console.log(MANIFESTS)

        return app;

    }
    */

};