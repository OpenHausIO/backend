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
// TODO: Rename to class.config.js
class Value {

    constructor(obj, changed = () => { }) {

        Object.assign(this, obj);
        this._id = String(obj._id);

        Object.defineProperty(this, "value", {
            set: (value) => {

                if (typeof (value) !== obj.type && value !== null) {
                    // throw error or just set false?
                    throw new TypeError(`value is not type of ${obj.type}, its: ${typeof value}`);
                    //return false;
                }

                // ignore usless set
                // fix #219
                if (value == obj.value) {
                    return;
                }

                obj.value = value;
                process.nextTick(changed, this);

            },
            get: () => {
                return obj.value;
            },
            // NOTE: Changes this to "false"?:
            // https://github.com/OpenHausIO/backend/blob/64a70b03826ad22ed614d951c48a049f34341a95/components/endpoints/class.state.js#L56
            configurable: true,
            enumerable: true
        });

    }

    static schema() {
        return Joi.object({
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return String(new mongodb.ObjectId());
            }),
            name: Joi.string().required(),
            key: Joi.string().required(),
            value: Joi.when("type", {
                is: "number",
                then: Joi.number()
            }).when("type", {
                is: "string",
                then: Joi.string()
            }).when("type", {
                is: "boolean",
                then: Joi.boolean()
            }).allow(null).default(null),
            type: Joi.string().valid("string", "number", "boolean").required(),
            description: Joi.string().required()
        });
    }

}

module.exports = Value;