const Joi = require("joi");
const mongodb = require("mongodb");
const uuid = require("uuid");



//const logger = require("../../system/logger").create("plugins");
//const COMMON_COMPONENT = require("../../system/component/common.js");
const COMPONENT = require("../../system/component/class.component.js");



const Plugin = require("./class.plugin.js");


class C_PLUGINS extends COMPONENT {

    constructor() {

        // inject logger, collection and schema object
        // super(logger, mongodb.client.collection("plugins"), {
        super("plugins", {
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return new mongodb.ObjectID();
            }),
            name: Joi.string().required(),
            uuid: Joi.string().default(() => {
                return uuid.v4();
            }),
            version: Joi.number().required(),
            runlevel: Joi.number().min(0).max(2).default(0),
            autostart: Joi.boolean().default(true),
            enabled: Joi.boolean().default(true)
        }, module);

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