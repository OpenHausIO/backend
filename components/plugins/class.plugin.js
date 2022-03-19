const fs = require("fs");
const path = require("path");
const logger = require("../../system/logger/index.js");

const Bootstrap = require("./class.bootstrap.js");

class Plugin {

    constructor(obj) {

        Object.assign(this, obj);
        this._id = String(obj._id);

        // needed?!
        // plugin gets not loaded if its disabled
        // so its not possible for a disabled plugin to enable itself
        Object.defineProperty(this, "enabled", {
            value: obj.enabled,
            configurable: false,
            writable: false,
            enumerable: true
        });

    }

    /**
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