const Joi = require("joi");
const mongodb = require("mongodb");

const dispatcher = require("../../system/dispatcher");
//const C_ENDPOINTS = require("../endpoints");

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
module.exports = class Makro {


    constructor(obj) {

        Object.assign(this, obj);
        this._id = String(obj._id);

    }


    execute(result, signal) {
        return new Promise((resolve, reject) => {
            try {
                if (this.type === "timer") {

                    let timeout = setTimeout(() => {
                        resolve(this._id, signal);
                    }, this.value);

                    signal.addEventListener("abort", () => {
                        clearTimeout(timeout);
                    }, {
                        once: true
                    });

                } else if (this.type === "command") {

                    dispatcher({
                        "component": "endpoints",
                        "item": this.endpoint,
                        "method": "trigger",
                        "args": [this.command]
                    });

                    resolve(this._id);

                } else {

                    reject(`${this.type} is invalid!`);

                }
            } catch (err) {

                reject(err);

            }
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
                return String(new mongodb.ObjectId());
            }),
            type: Joi.string().valid("command", "timer"/*, "state"*/).required(),
            timestamps: Joi.object({
                created: Joi.number().allow(null),
                updated: Joi.number().allow(null)
            })
        }).when(".type", {
            switch: [{
                is: "command",
                then: Joi.object({
                    endpoint: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                        return String(new mongodb.ObjectId());
                    }),
                    command: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                        return String(new mongodb.ObjectId());
                    })
                })
            }, {
                is: "timer",
                then: Joi.object({
                    value: Joi.number().min(1).max(100000)
                })
            }]
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
        return Makro.schema().validate(obj);
    }

};