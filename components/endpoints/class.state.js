const Joi = require("joi");
const mongodb = require("mongodb");

module.exports = class State {

    /**
     * State object
     * @constructor
     * @param {*} obj 
     */
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
     * State schema
     * @static
     * @returns Joi Object
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
     * Validate schema object
     * @param {*} obj 
     * @returns 
     */
    static validate(obj) {
        return State.schema().validate(obj);
    }

};