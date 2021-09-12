const Joi = require("joi");
const mongodb = require("mongodb");

/*
{
    _id: "604a75e6eb5de037846df24c",
    name: "Power On",                           // Human redable
    alias: "POWER_ON",                          // Something you can easy reminder, e.g for register handling callbacks
    //identifier: "1",                            // Something your devices sets/needs 
    payload: "PWR01",                           // Payload that gets send raw to the device
    description: "",                            // should be self-explanatory]
    interface: "603fe5d18791152879a9babd"
}, {
    _id: "604a75e6eb5de037846df24d",
    name: "Power Off",                          // Human redable
    alias: "POWER_OFF",                         // Something you can easy reminder, e.g for register handling callbacks
    //identifier: "2",                            // Something your devices sets/needs 
    payload: "PWR00",                           // Payload that gets send raw to the device
    description: "",                            // should be self-explanatory  
    interface: "603fe5d18791152879a9babd"
}, {
    _id: "60546eaff7d8a2b752330b37",
    name: "Master Volume",       // Human redable
    alias: "MASTER_VOLUME",      // Something you can easy reminder, e.g for register handling callbacks
    //identifier: "4",        // Something your devices sets/needs 
    payload: "MVL${v}",       // Payload that gets send raw to the device
    description: "",
    params: [{
        key: "v",
        min: 0,
        max: 100,
        default: 35
    }],
    interface: "603fe5d18791152879a9babd"
}, {
    _id: "604a75e6eb5de037846df24e",
    name: "Mute (Toggle)",
    //alias: "",
    payload: "AMTTG",
    interface: "603fe5d18791152879a9babd"
}
*/

module.exports = class Command {

    /**
     * Command object
     * @constructor
     * @param {*} obj 
     */
    constructor(obj) {

        Object.assign(this, obj);
        this._id = String(obj._id);

    }


    /**
     * Command schema
     * @static
     * @returns Joi Object
     */
    static schema() {
        return Joi.object({
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return String(new mongodb.ObjectID());
            }),
            interface: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),                       // device interface mongodb _id
            name: Joi.string().required(),                                              // Command name, something easy to identify
            alias: Joi.string().required(),                                             // Alias that you can rely in your plugins, machine to machine/hardcoded stuff
            identifier: Joi.string(),   // NOTE: move to endpoint schema?               // Thing api provides you, like light id or some custom thing for you
            payload: Joi.string(),
            description: Joi.string(),
            params: Joi.array().items({
                key: Joi.string().required(),
                default: Joi.string(),
                min: Joi.number(),
                max: Joi.number()
            })
        });
    }


    /**
     * Validate schema object
     * @param {*} obj 
     * @returns 
     */
    static validate(obj) {
        return Command.schema().validate(obj);
    }

};