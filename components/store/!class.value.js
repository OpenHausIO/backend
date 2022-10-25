const mongodb = require("mongodb");
const Joi = require("joi");

/**
 * @description
 * Represents a single key/value item.
 * 
 * @class Value
 * 
 * @param {Object} obj Object that matches the item schema. See properties below:
 * @param {Function} [changed] Function that is called when the value has changed
 * 
 * @property {String} _id MongoDB Object id is as string
 * @property {String} key Object key, like in a regular object
 * @property {String|Boolean|Numver} value Value of the property <key>
 * @property {String} type Type of <value> key: "string", "boolean" or "number"
 * @property {String} description Description for what the key is used
 * @property {String} namespace Object namespace, `uuid -v4`
 * @property {String} item MongoDB ObjectID for for what item the config applays (E.g: device or endpoint item)
 */
class Value {

    constructor(obj, changed = () => { }) {

        Object.assign(this, obj);
        this._id = String(obj._id);

        //let val = obj.value;

        console.log("Initial value", obj.value);

        Object.defineProperty(this, "value", {
            set: (value) => {

                if (typeof (value) !== obj.type) {
                    // throw error or just set false?
                    throw new TypeError(`value is not type of ${obj.type}, its: ${typeof value}`);
                    //return false;
                }

                //val = value;
                obj.value = value;
                process.nextTick(changed, this);

            },
            get: () => {
                //return val;
                return obj.value;
            },
            configurable: true,
            enumerable: true
        });

    }

    static schema() {
        return Joi.object({
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return String(new mongodb.ObjectID());
            }),
            key: Joi.string().required(),
            value: Joi.any().required(),
            type: Joi.string().valid("string", "number", "boolean").required(),
            description: Joi.string().required()
        });
    }

}

module.exports = Value;