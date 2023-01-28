const { EventEmitter } = require("events");
const Value = require("./class.value.js");


/**
 * @description
 * Contains a collection of values that are used as configuration object
 * 
 * @class Store
 * 
 * @param {Object} obj Object that matches the item schema. See properties below:
 * 
 * @property {String} _id MongoDB Object id is as string
 * @property {Array} config Array of value instances, see "value" link below
 * @property {String} item Can be a Endpoint or Device _id, or what ever you want
 * @property {String} namespace Object namespace, `uuid -v4`
 * 
 * @see value components/store/class.value.js
 */
class Store {

    #privates = new Map();

    constructor(obj, scope) {

        // create event emitter for lean object
        let events = new EventEmitter();
        this.#privates.set("events", events);

        Object.assign(this, obj);
        this._id = String(obj._id);

        this.config = obj.config.map((data) => {
            return new Value(data, async () => {
                try {

                    // feedback
                    scope.logger.debug(`Value in store "${this._id}" changed: ${data.key}=${data.value}`);

                    // update item in database
                    await scope.update(this._id, this);

                } catch (err) {

                    scope.logger.warn(err, `Could not update item value in database. (${obj._id}) ${data.key}=${data.value}`);

                } finally {

                    // notify for changes
                    events.emit("changed", data.key, data.value);

                }
            });
        });

    }


    /**
     * @function changes
     * Returns a EventEmitter that can be used to watch for changes
     * 
     * @fire changed Emitted when the value changed
     * 
     * @returns {EventEmitter} node.js EventEmitter instance
     * 
     * @link https://nodejs.org/dist/latest-v16.x/docs/api/events.html#class-eventemitter
     */
    changes() {
        return this.#privates.get("events");
    }


    /**
     * @function lean
     * Create a new lean object with key/value based on schema
     * 
     * @returns {Object} Key/value object
     */
    lean() {

        /*
        // get private event emitter
        let events = this.#privates.get("events");

        // create lean object with getter/setter from value class
        let obj = this.config.reduce((acc, cur, i, arr) => {

            // get property descriptor to define getter/setter functions
            let descriptor = Object.getOwnPropertyDescriptor(arr[i], "value");

            // define original property descriptor
            Object.defineProperty(acc, cur.key, descriptor);

            return acc;

        }, {});

        // "hide" events behind lean object
        return _mixins([obj, events], {
            setPrototype: true
        });
        */

        return this.config.reduce((prev, cur) => {

            let descriptor = Object.getOwnPropertyDescriptor(cur, "value");
            Object.defineProperty(prev, cur.key, descriptor);

            return prev;

        }, {});
    }

}

module.exports = Store;