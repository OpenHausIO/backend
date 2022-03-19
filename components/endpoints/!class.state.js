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
            interface: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
            name: Joi.string().required(),
            alias: Joi.string().required(),
            value: Joi.any(),   // FIXME check if value = typeof type
            type: Joi.string().enum("number", "string", "boolean").default("string"),
            identifier: Joi.string().allow(null).default(null),
            description: Joi.string().allow(null).default(null)
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