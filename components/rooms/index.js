const mongodb = require("mongodb");
const Joi = require("joi");

const logger = require("../../system/logger").create("rooms");
const COMMON_COMPONENT = require("../../system/component/common.js");

const Room = require("./class.room.js");

class C_ROOMS extends COMMON_COMPONENT {
    constructor() {

        // inject logger, collection and schema object
        super(logger, mongodb.client.collection("rooms"), {
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return new mongodb.ObjectID();
            }),
            name: Joi.string().required(),
            number: Joi.number().allow(null).default(null),
            floor: Joi.number().allow(null).default(null),
            icon: Joi.string().allow(null).default(null)
        }, module);

    }
}


// create component instance
const instance = module.exports = new C_ROOMS();


// init component
// set items/build cache
instance.init((scope, ready) => {
    scope.collection.find({}).toArray((err, data) => {
        if (err) {

            // shit...
            ready(err);

        } else {

            data = data.map((obj) => {
                return new Room(obj);
            });

            scope.items.push(...data);

            // init done
            ready(null);

        }
    });
});