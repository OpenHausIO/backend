const Joi = require("joi");

module.exports = class Param {

    constructor(obj) {

        Object.assign(this, obj);

        Object.defineProperty(this, "value", {
            get() {
                return obj.value;
            },
            set(val) {

                if (val === null) {
                    obj.value = null;
                    return;
                }

                if (typeof (val) !== obj.type) {
                    throw new Error(`Parameter "${obj.key}" invalid type ${typeof (val)}. Expected ${obj.type}`);
                }

                if (obj.type === "number" && !(val >= obj.min && obj.max >= val)) {
                    throw new Error(`Invalid value: ${val}. Expected value >= ${obj.min} or ${obj.max} >= value`);
                }

                obj.value = val;

            },
            enumerable: true,
            configurable: true
        });

    }

    static schema() {
        return Joi.object({
            type: Joi.string().valid("number", "string", "boolean").required(),
            key: Joi.string().required()
        }).when(".type", {
            switch: [{
                is: "number",
                then: Joi.object({
                    value: Joi.number().default(null).allow(null),
                    min: Joi.number().default(0),
                    max: Joi.number().default(100),
                    //default: Joi.number().allow(null).default(null)
                })
            }, {
                is: "string",
                then: Joi.object({
                    value: Joi.string().default(null).allow(null),
                    //default: Joi.string().allow(null).default(null)
                })
            }, {
                is: "boolean",
                then: Joi.object({
                    value: Joi.boolean().default(null).allow(null),
                    //default: Joi.boolean().allow(null).default(null)
                })
            }]
        });
    }

    static validate(data) {
        return Param.schema().validate(data);
    }

};