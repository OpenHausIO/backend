const { EventEmitter } = require("events");

const mongodb = require("mongodb");
const Joi = require("joi");

const _debounce = require("../../helper/debounce.js");

const Secret = require("./class.secret.js");

const Item = require("../../system/component/class.item.js");

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
module.exports = class Vault extends Item {

    #privates = new Map();

    constructor(obj) {

        super(obj);

        // create event emitter for lean object
        let events = new EventEmitter();
        let { logger, update } = Vault.scope;
        this.#privates.set("events", events);

        let changed = _debounce(async (secret) => {
            try {

                // feedback
                logger.debug(`Secret "${secret.key}" changed`);

                // update item in database
                await update(this._id, this);

            } catch (err) {

                logger.warn(err, `Could not update secret value. (${obj._id}) ${secret.key}=${secret.value}`);

            } finally {

                // notify for changes
                events.emit("changed", this);

            }
        }, Number(process.env.DATABASE_UPDATE_DEBOUNCE_TIMER));

        // removed for #356
        //Object.assign(this, obj);
        //this._id = String(obj._id);

        this.secrets = obj.secrets.map((secret) => {
            return new Secret(secret, () => {
                changed(secret);
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
            name: Joi.string().required(),
            identifier: Joi.string().required(), // TODO: remove
            description: Joi.string().allow(null).default(null),
            secrets: Joi.array().items(Secret.schema()).default([])
        });
    }

    static validate(data) {
        return Vault.schema().validate(data);
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

};