const Joi = require("joi");

module.exports = class Input {

    static schema() {
        return Joi.object({
            name: Joi.string().required(),
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
        return Input.schema().validate(data);
    }

};