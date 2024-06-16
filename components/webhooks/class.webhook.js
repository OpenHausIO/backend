const Joi = require("joi");
const mongodb = require("mongodb");

const Item = require("../../system/component/class.item.js");

/**
 * @description
 * Represents a webhook item
 * 
 * @class Webhook
 * 
 * @param {Object} obj Object that matches the item schema. See properties below:
 * 
 * @property {String} _id MongoDB Object is as string
 * @property {String} name Webhook name
 */
module.exports = class Webhook extends Item {

    constructor(obj) {

        super(obj);

        // removed for #356
        //Object.assign(this, obj);
        //this._id = String(obj._id);

        Object.defineProperty(this, "_handler", {
            value: [],
            configurable: false,
            enumerable: false,
            writable: false
        });

        Object.defineProperty(this, "_trigger", {
            value: (body, query) => {

                this._handler.forEach((cb) => {
                    cb(body, query);
                });

            },
            enumerable: false,
            configurable: false,
            writable: false
        });

    }

    static schema() {
        return Joi.object({
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return String(new mongodb.ObjectId());
            }),
            name: Joi.string().required()
        });
    }

    static validate(data) {
        return Webhook.schema().validate(data);
    }

    handle(cb) {
        this._handler.push(cb);
    }

};