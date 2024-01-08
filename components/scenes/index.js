//const logger = require("../../system/logger").create("rooms");
//const COMMON_COMPONENT = require("../../system/component/common.js");
const COMPONENT = require("../../system/component/class.component.js");

const Scene = require("./class.scene.js");
const Makro = require("./class.makro.js");
const Trigger = require("./class.trigger.js");

/**
 * @description
 * ...
 * 
 * @class C_SCENES
 * @extends COMPONENT system/component/class.component.js
 * 
 */
class C_SCENES extends COMPONENT {
    constructor() {

        // inject logger, collection and schema object
        super("scenes", Scene.schema(), module);

        this.hooks.post("add", (data, next) => {
            next(null, new Scene(data));
        });

        // handle change makro array
        // see #364
        this.hooks.post("update", (data, next) => {

            data.makros.forEach((makro, i, arr) => {
                if (!(makro instanceof Makro)) {
                    arr[i] = new Makro(makro);
                }
            });

            // fix #390
            data.triggers.forEach((trigger, i, arr) => {
                if (!(trigger instanceof Trigger)) {
                    arr[i] = new Trigger(trigger);
                }
            });

            next();

        });

    }
}


// create component instance
const instance = module.exports = new C_SCENES();


// init component
// set items/build cache
instance.init((scope, ready) => {
    scope.collection.find({}).toArray((err, data) => {
        if (err) {

            // shit...
            ready(err);

        } else {

            data.forEach((obj) => {
                scope.items.push(new Scene(obj));
            });

            // init done
            ready(null);

        }
    });
});