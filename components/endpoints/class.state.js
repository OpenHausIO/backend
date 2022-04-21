const Joi = require("joi");
const mongodb = require("mongodb");

/**
 * @description
 * This is a functions as a state for a endpoint.<br />
 * E.g "Power" state, or "Volume"
 * 
 * @class State
 * 
 * @param {Object} obj Object that matches the item schema. See properties below:
 * 
 * @property {String} [_id=ObjectID] MongoDB ObjectID as String
 * @property {String} name State name. E.g.: <code>Power</code> or <code>Temperature</code>
 * @property {String} [description=null] State description, e.g.: <code>Power state</code> or <code>Room temperature</code>
 * @property {String,Number,Boolean} value The setted value
 * @property {String,Number,Boolean} type Type of state value
 * @property {String} [identifier=null] Machine readable identifier, e.g.: <code>POWER</code> or <code>TEMPERATURE</code>
 * @property {Object} timestamps Timestamps that are set when added or updated
 * @property {Number} [timestamps.created=Date.now()] Set when added
 * @property {Number} timestamps.updated Every time set to Date.now() when a value is set
 */
module.exports = class State {


    constructor(obj) {

        Object.assign(this, obj);
        this._id = String(obj._id);

        this.timestamps = Object.assign({
            created: Date.now(),
            updated: null
        }, obj.timestamps);

        if (!obj.value) {
            obj.value = null;
        }

        // intercept get/set value
        Object.defineProperty(this, "value", {
            get: () => {
                return obj.value;
            },
            set: (value) => {

                if ((typeof value) !== this.type) {
                    return;
                }

                obj.value = value;

                this.timestamps.updated = Date.now();

            },
            configurable: false,
            enumerable: true
        });

    }


    /**
     * @function schema
     * State schema, see properties above.
     * 
     * @static
     * 
     * @returns {Object} Joi Object
     * 
     * @link https://joi.dev/api/?v=17.6.0#anyvalidatevalue-options
     */
    static schema() {
        return Joi.object({
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return String(new mongodb.ObjectID());
            }),
            //interface: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(), // for what?! 
            name: Joi.string().required(),
            description: Joi.string().default(null),
            alias: Joi.string().required(),
            value: Joi.when("type", {
                is: "number",
                then: Joi.number()
            }).when("type", {
                is: "string",
                then: Joi.string()
            }).when("type", {
                is: "boolean",
                then: Joi.boolean()
            }).default(null),
            type: Joi.string().valid("number", "string", "boolean").required(),
            identifier: Joi.string().default(null),
            timestamps: Joi.object({
                created: Joi.number(),
                updated: Joi.number()
            }).default(() => {
                return {
                    created: Date.now(),
                    updated: null
                };
            })
        });
    }


    /**
     * @function validate
     * Validate schema object
     * 
     * @static
     * 
     * @param {Object} obj Input data that matches the schema
     * 
     * @returns {Object} Joi validation object
     * 
     * @link https://joi.dev/api/?v=17.6.0#anyvalidatevalue-options
     */
    static validate(obj) {
        return State.schema().validate(obj);
    }

};