const { EventEmitter } = require("events");

const Joi = require("joi");
const mongodb = require("mongodb");

const types = require("./trigger-types.js");

module.exports = class Trigger {

    /**
     * @class Trigger
     * 
     * @param {Object} obj Parameter object
     * 
     * @property {EventEmitter} signal Event Emitter signal
     * @property {Number|null} fired Last fired timestamp
     * @property {Object} prams Parameter object
     */
    constructor(obj) {

        //this.signal = new TriggerSignal();
        this.signal = new EventEmitter();
        this.fired = null;

        Object.assign(this, obj);

        if (types[obj.type]) {
            types[obj.type](this, this.params);
        }

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
            type: Joi.string().valid("cronjob", "webhook"/*, "state", "scene"*/).required(),
            enabled: Joi.boolean().default(true),
            //params: Joi.object()....
            timestamps: Joi.object({
                created: Joi.number().allow(null),
                updated: Joi.number().allow(null)
            })
        }).when(".type", {
            switch: [{
                is: "cronjob",
                then: Joi.object({
                    params: Joi.object({
                        cron: Joi.string().pattern(/^((((\d+,)+\d+|(\d+(\/|-|#)\d+)|\d+L?|\*(\/\d+)?|L(-\d+)?|\?|[A-Z]{3}(-[A-Z]{3})?) ?){5,7})$/),
                    })
                })
            }, {
                is: "webhook",
                then: Joi.object({
                    params: Joi.object({
                        _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
                    })
                })
            }/*,{
                is: "state",
                then: Joi.object({
                    params: Joi.object({
                        _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
                        threshold: Joi.alternatives(Joi.number(), Joi.string(), Joi.boolean()).required(),
                    })
                })
            },{
                is: "scene",
                then: Joi.object({
                    params: Joi.object({
                        _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
                    })
                })
            }**/]
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
        return Trigger.schema().validate(obj);
    }

    fire() {
        if (this.enabled) {
            this.fired = Date.now();
            this.signal.emit("fire");
        }
    }

};