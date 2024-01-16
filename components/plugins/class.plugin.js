const fs = require("fs");
const path = require("path");
const Joi = require("joi");
const mongodb = require("mongodb");
const logger = require("../../system/logger/index.js");
const semver = require("semver");
const pkg = require("../../package.json");
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
            }),
            version: Joi.number().required(),
            //runlevel: Joi.number().min(0).max(2).default(0),
            autostart: Joi.boolean().default(true),
            enabled: Joi.boolean().default(true),
            intents: Joi.array().items("devices", "endpoints", "plugins", "rooms", "ssdp", "store", "users", "vault", "mqtt", "mdns", "webhooks").required()
        });
    }

    static validate(data) {
        return Plugin.schema().validate(data);
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

                let json = {};
                let plugin = path.resolve(process.cwd(), "plugins", this.uuid);
                let file = path.resolve(plugin, "package.json");

                // 1) check if plugin is compatible
                try {

                    let content = fs.readFileSync(file);
                    json = JSON.parse(content);

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

                // 2) start plugin
                if (fs.existsSync(plugin)) {

                    let init = (dependencies, cb) => {
                        try {

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

                    init[Symbol.for("uuid")] = this.uuid;

                    try {

                        let returns = require(path.resolve(plugin, "index.js"))(this, this.logger, init);

                        if (!returns) {
                            return;
                        }

                        if (returns[Symbol.for("uuid")] !== this.uuid) {
                            logger.warn(`Plugin "${this.uuid}" (${this.name}) does not return the init function!`);
                            throw new Error("Invalid init function returnd!");
                        }

                        this.started = true;

                    } catch (err) {
                        logger.error(`Error in plugin "${this.name}": `, err);
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