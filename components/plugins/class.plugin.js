const fs = require("fs");
const path = require("path");
const Joi = require("joi");
const mongodb = require("mongodb");
const logger = require("../../system/logger/index.js");
const semver = require("semver");
//const pkg = require("../../package.json");
const uuid = require("uuid");

const Item = require("../../system/component/class.item.js");

//const Bootstrap = require("./class.bootstrap.js");

/**
 * @description
 * Represents a single plugin item that is stored in the components `.items` array.
 * 
 * @class Plugin
 * 
 * @param {Object} obj Object that matches the item schema. See properties below:
 * 
 * @property {String} _id MongoDB Object id is as string
 * @property {String} name Human readable name
 * @property {String} uuid UUIDv4 that is used a unique identifier and file/folder name on the filesystem
 * @property {Number} version Version number of the plugin. e.g. `1.2`, `0.4`
 * @property {Boolean} autostart Start the plugin after the backend has initzialized successful?
 * @property {Boolean} enabled Indicates if this thing can do anything
 */
module.exports = class Plugin extends Item {

    constructor(obj) {

        super(obj);

        // removed for #356
        //Object.assign(this, obj);
        //this._id = String(obj._id);

        Object.defineProperty(this, "logger", {
            value: logger.create(`plugins/${this.uuid}`),
            configurable: false,
            enumerable: false,
            writable: false
        });

        Object.defineProperty(this, "started", {
            value: false,
            configurable: false,
            enumerable: false,
            writable: true
        });

    }

    static schema() {
        return Joi.object({
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return String(new mongodb.ObjectId());
            }),
            name: Joi.string().required(),
            uuid: Joi.string().default(() => {
                return uuid.v4();
            }).messages({
                "any.invalid": `{{#label}} needs to be a valid v4 UUID`
            }).custom((value, helpers) => {

                if (!uuid.validate(value) || uuid.version(value) !== 4) {
                    return helpers.error("any.invalid");
                }

                return value;

            }),
            version: Joi.string().required().messages({
                "any.invalid": `{{#label}} needs to be a valid semver version`
            }).custom((value, helpers) => {

                if (semver.valid(value) === null) {
                    return helpers.error("any.invalid");
                }

                return semver.clean(value);

            }),
            //runlevel: Joi.number().min(0).max(2).default(0),
            autostart: Joi.boolean().default(true),
            enabled: Joi.boolean().default(true),
            intents: Joi.array().items("devices", "endpoints", "plugins", "rooms", "ssdp", "store", "users", "vault", "mqtt", "mdns", "webhooks").required()
        });
    }

    static validate(data) {
        return Plugin.schema().validate(data);
    }

    static init(data, logger) {

        let init = (dependencies, cb) => {
            try {

                // NOTE: Monkey patch ready/abort method to init?
                // A plugin could siganlize if its ready or needs to be restarted
                /*
                let init = new Promise((resolve, reject) => {
                    init.ready = resolve;
                    init.abort = reject;
                });
                */

                const granted = dependencies.every((c) => {
                    if (data.intents.includes(c)) {

                        return true;

                    } else {

                        logger.warn(`Plugin ${data.uuid} (${data.name}) wants to access not registerd intens "${c}"`);
                        return false;

                    }
                });

                if (granted) {

                    let components = dependencies.map((name) => {
                        return require(path.resolve(process.cwd(), `components/${name}`));
                    });

                    cb(data, components);
                    return init;

                } else {

                    throw new Error(`Unregisterd intents access approach`);

                }

            } catch (err) {

                logger.error(err, `Plugin could not initalize!`, err.message);
                throw err;

            }
        };

        return init;

    }

    /**
     * @function start
     * Start installed plugin
     */
    start() {
        if (!this.started) {
            if (this.enabled) {

                // feedback
                logger.debug(`Start plugin "${this.name}"...`);

                //let json = {};
                let plugin = path.resolve(process.cwd(), "plugins", this.uuid);
                //let file = path.resolve(plugin, "package.json");

                // 1) check if plugin is compatible
                // removed, see #511
                /*                
                try {

                    let content = fs.readFileSync(file);
                    json = JSON.parse(content);

                    // check in further version:
                    // json?.openhaus?.backend || json?.openhaus?.versions?.backend
                    // when a plugin provides frontend stuff or store data about itself in openhaus.plugin/openhaus.intents
                    if (!semver.satisfies(pkg.version, json?.backend)) {
                        this.logger.warn(`Plugin "${this.name}" is incompatible. It may work not properly or break something!`);
                    }

                } catch (err) {

                    this.logger.warn(err, `Could not check plugin compatibility for plugin "${this.name}"`);

                    if (err.code === "ENOENT") {
                        this.logger.warn(`package.json for plugin "${this.name}" not found, try to start it anyway...`);
                    } else {
                        this.logger.error(err);
                    }

                }
                    */

                // 2) start plugin
                if (fs.existsSync(plugin)) {

                    /*
                    let init = (dependencies, cb) => {
                        try {

                            // NOTE: Monkey patch ready/abort method to init?
                            // A plugin could siganlize if its ready or needs to be restarted
                            /*
                            let init = new Promise((resolve, reject) => {
                                init.ready = resolve;
                                init.abort = reject;
                            });
                            *

                            const granted = dependencies.every((c) => {
                                if (this.intents.includes(c)) {

                                    return true;

                                } else {

                                    logger.warn(`Plugin ${this.uuid} (${this.name}) wants to access not registerd intens "${c}"`);
                                    return false;

                                }
                            });

                            if (granted) {

                                let components = dependencies.map((name) => {
                                    return require(path.resolve(process.cwd(), `components/${name}`));
                                });

                                cb(this, components);
                                return init;

                            } else {

                                throw new Error(`Unregisterd intents access approach`);

                            }

                        } catch (err) {

                            logger.error(err, `Plugin could not initalize!`, err.message);
                            throw err;

                        }
                    };
                    */

                    try {

                        let init = Plugin.init(this, this.logger);
                        //init[Symbol.for("uuid")] = this.uuid;

                        let returns = require(path.resolve(plugin, "index.js"))(this, this.logger, init);

                        if (returns !== init) {
                            throw new Error("Invalid init function returnd!");
                        }

                        this.started = true;

                    } catch (err) {

                        logger.error(err, `Error in plugin "${this.name}": `);
                        throw err;

                    }

                } else {

                    logger.error(`Could not found plugin file/folder "${this.uuid}"`);
                    throw new Error("Plugin not found");

                }

            } else {

                let err = Error("Plugin is not enabled!");
                err.code = "PLUGIN_NOT_ENABLED";

                throw err;

            }
        }
    }

    /*
    stop(){
        // TODO: Implement
        // When plugins run in seperate worker process
    }
    */

};