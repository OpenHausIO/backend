const mongodb = require("mongodb");
const Joi = require("joi");

const logger = require("../../system/logger").create("scenes");
const COMMON_COMPONENT = require("../../system/component/common.js");

const Scene = require("./class.scene.js");
const Bank = require("./class.bank.js");
const Trigger = require("./class.trigger.js");

// https://github.com/sideway/joi/issues/705
// https://stackoverflow.com/questions/54437782/how-to-modify-existing-keys-in-joi-object

class C_SCENES extends COMMON_COMPONENT {
    constructor() {

        // inject logger, collection and schema object
        super(logger, mongodb.client.collection("scenes"), {
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return new mongodb.ObjectID();
            }),
            name: Joi.string().required(),
            banks: Joi.array().items().min(1).required(),          // .items does not validate
            triggers: Joi.array().items(Trigger.schema()).min(1).required(),    // .items does not validate
            enabled: Joi.boolean().default(true)
        }, module);

    };
};


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

            data = data.map((obj) => {
                return new Scene(obj);
            });

            scope.items.push(...data);

            // init done
            ready(null);

        }
    });
});