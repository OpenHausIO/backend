const Item = require("../../system/component/class.item.js");
const Joi = require("joi");
const mongodb = require("mongodb");

/**
 * @description
 * Represents a mqtt topic item
 * 
 * @class MQTT
 * 
 * @param {Object} obj Object that matches the item schema. See properties below:
 * 
 * @property {String} _id MongoDB Object is as string
 * @property {String} topic MQTT topic e.g. `air-sensor/sensor/particulate_matter_25m_concentration/state`
 * @property {String} description Description for Admins/Topic
 */
class MQTT extends Item {

    constructor(obj) {

        super(obj);

        // removed for #356
        //Object.assign(this, obj);
        //this._id = String(obj._id);

        Object.defineProperty(this, "_subscriber", {
            value: [],
            writable: false,
            configurable: false,
            enumerable: false
        });

        Object.defineProperty(this, "_publisher", {
            value: () => { },
            writable: true,
            configurable: true,
            enumerable: false
        });

    }

    static schema() {
        return Joi.object({
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return String(new mongodb.ObjectId());
            }),
            topic: Joi.string().required(),
            description: Joi.string().allow(null).default(null),
            /*
            value: Joi.any().custom((value, helpers) => {

                if (!Buffer.isBuffer(value)) {
                    return helpers.error("any.invalid");
                }

                return value;

            }, "Buffer Validation"),
            */
            timestamps: {
                published: Joi.number().allow(null).default(null),
            }
        });
    }

    static validate(data) {
        return MQTT.schema().validate(data);
    }

    /**
     * Subscribe to this topic
     * @param {Function} cb Callback
     */
    subscribe(cb) {
        this._subscriber.push(cb);
    }

    /**
     * Publish data on this topic
     * @param {*} data Payload
     */
    publish(data) {
        this._publisher(data);
    }

}

module.exports = MQTT;