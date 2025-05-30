const Joi = require("joi");
const mongodb = require("mongodb");

const Item = require("../../system/component/class.item.js");

const _debounce = require("../../helper/debounce.js");

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

        let { update, logger } = Webhook.scope;

        let updater = _debounce(async () => {
            try {

                // trigger update on endpoint item
                // otherwise ui is not rendered/refreshed on state changed
                await update(this._id, this);

                // feedback
                logger.verbose("Webhook trigger timestamp updated", this.timestamps);

            } catch (err) {

                logger.warn(err, "Could not update webhook item after debouncing");

            }
        }, 100);

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

                this.timestamps.triggered = Date.now();
                process.nextTick(updater, this);

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
            name: Joi.string().required(),
            timestamps: {
                triggered: Joi.number().allow(null).default(null),
            }
        });
    }

    static validate(data) {
        return Webhook.schema().validate(data);
    }

    handle(cb) {
        this._handler.push(cb);
    }

};