const fs = require("fs");
const path = require("path");



//const logger = require("../../system/logger").create("plugins");
//const COMMON_COMPONENT = require("../../system/component/common.js");
const COMPONENT = require("../../system/component/class.component.js");



const Plugin = require("./class.plugin.js");

/**
 * @description
 * The Plugin component handles everything that has to do with plugins
 * 
 * @class C_PLUGINS
 * @extends COMPONENT system/component/class.component.js

 * @example 
 * ```js
 * const C_PLUGINS = require(".../components/plugins");
 * 
 * console.log(C_PLUGINS.items);
 * ```
 */
class C_PLUGINS extends COMPONENT {

    constructor() {

        // inject logger, collection and schema object
        // super(logger, mongodb.client.collection("plugins"), {
        super("plugins", Plugin.schema(), module);

        this.hooks.post("add", (data, next) => {
            // NOTE: use path to plugins set via env, see #432
            fs.mkdir(path.resolve(process.cwd(), "plugins", data.uuid), (err) => {

                // ignore when folder exists
                // fix 263
                if (err?.code === "EEXIST") {
                    this.logger.warn("Plugin folder exists, continue anway.", err);
                    err = null;
                }

                next(err || null, new Plugin(data));

            });
        });

        this.collection.createIndex("uuid", {
            unique: true
        });

        this.hooks.post("remove", (item, result, _id, next) => {
            // NOTE: use path to plugins set via env, see #432
            fs.rm(path.resolve(process.cwd(), "plugins", item.uuid), {
                recursive: true
            }, (err) => {

                // ignore when folder not exists
                if (err?.code === "ENOENT") {
                    this.logger.warn("Plugin folder does not exists, continue anway.", err);
                    err = null;
                }

                next(err || null, item, result, _id);

            });
        });

    }

}


//console.log(util.inspect(module.exports, true, 10, true))

// create component instance
const instance = module.exports = new C_PLUGINS();


// init component
// set items/build cache
instance.init((scope, ready) => {
    scope.collection.find({}).toArray((err, data) => {
        if (err) {

            // shit...
            ready(err);

        } else {

            data = data.map((obj) => {
                return new Plugin(obj);
            });

            scope.items.push(...data);


            // init done
            ready(null);

        }
    });
});