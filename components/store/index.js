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
        super("store", Store.schema(), [
            Store
        ]);

        this.hooks.post("add", (data, next) => {
            next(null, new Store(data));
        });

        // fix #406
        this.hooks.post("update", (data, next) => {

            data.config.forEach((value, i, arr) => {
                if (!(value instanceof Value)) {
                    arr[i] = new Value(value);
                }
            });

            next();

        });

        this.collection.createIndex("uuid", {
            unique: true
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
                return new Store(obj);
            });

            scope.items.push(...data);

            // init done
            ready(null);

        }
    });

});