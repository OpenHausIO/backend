const fs = require("fs");
const path = require("path");

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

    };

    /**
     * Start/boot installed plugin
     */
    boot() {
        if (this.enabled) {
            try {

                //console.log("Straing");

                let plugin = path.resolve(process.cwd(), "plugins", this.uuid);

                fs.existsSync(plugin);

                let pclass = require(path.resolve(plugin, "index.js"))(Bootstrap);

                new pclass(this);


            } catch (err) {

                console.error("Error in plugin:", err);

                // keep OpenHaus running if plugin crashs
                if (process.env.NODE_ENV !== "production") {
                    process.exit(999);
                }

            }
        } else {

            let err = Error("Plugin is not enabled!");
            err.code = "PLUGIN_NOT_ENABLED";

            throw err;

        }
    };

};

module.exports = Plugin;