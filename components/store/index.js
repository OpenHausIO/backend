const mongodb = require("mongodb");
const Joi = require("joi");
const uuid = require("uuid");

const COMPONENT = require("../../system/component/class.component.js");

//const Value = require("./class.value.js");
//const Namespace = require("./class.namespace.js");
const Store = require("./class.store.js");
const Value = require("./class.value.js");

/**
 * @description
 * This component can be used to store key/value configurations.<br />
 * Just like in redis, or a plain javascript object.<br />
 * If the value gets modified the changes are synct to other instance via MongoDB change streams (if enabled).
 *  
 * @class C_STORE
 * @extends COMPONENT system/component/class.component.js
 * 
 * @example 
 * ```js
 * const C_STORE = require(".../components/store");
 * 
 * C_STORE.add({
 *   namespace: "4b564aab-ff4d-42b9-b15b-38885d4a0613",
 *   key: "poll_interval",
 *   value: 6000,
 *   description: "Interval in which miliseconds the API should be fetched"
 * });
 * ```
 * 
 * @see Namespace components/store/class.namespace.js
 * @link https://www.mongodb.com/docs/manual/changeStreams/
 */
class C_STORE extends COMPONENT {

    constructor() {

        // inject logger, collection and schema object
        super("store", {
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return String(new mongodb.ObjectId());
            }),
            config: Joi.array().min(1).items(Value.schema()).required(),
            item: Joi.string().allow(null).default(null),
            namespace: Joi.string().default(() => {
                return uuid.v4();
            }),
        }, module);

        this.hooks.post("add", (data, next) => {
            next(null, new Store(data, this));
        });

    }

}


// create component instance
const instance = module.exports = new C_STORE();


// init component
// set items/build cache
instance.init((scope, ready) => {

    scope.collection.find({}).toArray((err, data) => {
        if (err) {

            // shit...
            ready(err);

        } else {

            data = data.map((obj) => {
                return new Store(obj, scope);
            });

            scope.items.push(...data);

            // init done
            ready(null);

        }
    });

});