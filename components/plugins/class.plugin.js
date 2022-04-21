const fs = require("fs");
const path = require("path");
const logger = require("../../system/logger/index.js");

const Bootstrap = require("./class.bootstrap.js");

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
     * @function boot
     * Start/boot installed plugin
     */
    boot() {
        if (this.enabled) {
            try {

                //console.log("Straing");

                let plugin = path.resolve(process.cwd(), "plugins", this.uuid);

                if (fs.existsSync(plugin)) {

                    let pclass = require(path.resolve(plugin, "index.js"))(Bootstrap);

                    new pclass(this);

                } else {

                    logger.error(`Could not found plugin file/folder "${this.uuid}"`);
                    throw new Error("Plugin not found");

                }


            } catch (err) {
                logger.warn(`Error in plugin "${this.name}": `, err);
            }
        } else {

            let err = Error("Plugin is not enabled!");
            err.code = "PLUGIN_NOT_ENABLED";

            throw err;

        }
    }

}

module.exports = Plugin;