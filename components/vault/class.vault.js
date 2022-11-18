const { EventEmitter } = require("events");

const mongodb = require("mongodb");
const Joi = require("joi");

const Secret = require("./class.secret.js");

/**
 * @description
 * Contains a collection of secrets
 * 
 * @class Vault
 * 
 * @param {Object} obj Object that matches the item schema. See properties below:
 * 
 * @property {String} _id MongoDB Object id is as string
 * @property {String} key 
 * @property {String} value 
 * @property {String} description 
 * 
 * @see secret components/vault/class.secret.js
 */
class Vault {

    #privates = new Map();

    constructor(obj, scope) {

        // create event emitter for lean object
        let events = new EventEmitter();
        this.#privates.set("events", events);

        Object.assign(this, obj);
        this._id = String(obj._id);

        this.secrets = obj.secrets.map((data) => {
            return new Secret(data, async () => {
                try {

                    // feedback
                    scope.logger.debug(`Secret "${data.name}" value changed`);

                    // update item in database
                    await scope.update(this._id, this);

                    events.emit("changed", this);

                } catch (err) {

                    scope.logger.warn(err, `Could not update secret value. (${obj._id}) ${data.key}=${data.value}`);

                } finally {

                    // notify for changes
                    events.emit("changed", data.key, data.value);

                }
            });
        });

    }


    /**
     * @function schema
     * Returns a joi object that matches the schema
     * 
     * @static
     * 
     * @returns {Object} Joi.object()
     */
    static schema() {
        return Joi.object({
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return String(new mongodb.ObjectId());
            }),
            key: Joi.string().required(),
            value: Joi.any().required(),
            description: Joi.string().required()
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
    //changes(cb) {
    changes() {

        /*
        let ee = this.#privates.get("events");

        let handler = (...args) => {
            cb(...args);
        };

        if (cb) {
            ee.on("changed", handler);
        }

        return Object.assign(() => {
            ee.off("changed", handler);
        }, ee);
        */

        return this.#privates.get("events");

    }


    /**
     * @function decrypt
     * Decrypt all secrets at once, and returns a object with key/value
     * 
     * @returns {Object} Key = Secret key property, Value = decrypted value
     */
    decrypt() {
        return this.secrets.reduce((prev, cur) => {
            prev[cur.key] = cur.decrypt();
            return prev;
        }, {});
    }

}

module.exports = Vault;