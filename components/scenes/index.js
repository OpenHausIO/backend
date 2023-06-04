const mongodb = require("mongodb");
const Joi = require("joi");

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
        super("scenes", {
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return String(new mongodb.ObjectId());
            }),
            name: Joi.string().required(),
            makros: Joi.array().items(Makro.schema()).default([]),
            triggers: Joi.array().items(Trigger.schema()).default([])
        }, module);

        this.hooks.post("add", (data, next) => {
            next(null, new Scene(data));
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