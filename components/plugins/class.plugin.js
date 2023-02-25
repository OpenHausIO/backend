const fs = require("fs");
const path = require("path");
const logger = require("../../system/logger/index.js");

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
class Plugin {

    constructor(obj) {

        Object.assign(this, obj);
        this._id = String(obj._id);

    }

    /**
     * @function start
     * Start installed plugin
     */
    start() {
        if (this.enabled) {

            let plugin = path.resolve(process.cwd(), "plugins", this.uuid);

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

                    let log = logger.create(`plugins/${this.uuid}`);
                    let returns = require(path.resolve(plugin, "index.js"))(this, log, init);

                    if (!returns) {
                        return;
                    }

                    if (returns[Symbol.for("uuid")] !== this.uuid) {
                        logger.warn(`Plugin "${this.uuid}" (${this.name}) does not return the init function!`);
                        throw new Error("Invalid init function returnd!");
                    }

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

    /*
    stop(){
        // TODO: Implement
        // When plugins run in seperate worker process
    }
    */

}

module.exports = Plugin;