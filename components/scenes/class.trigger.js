const EventEmitter = require("events");
const Joi = require("joi");
const mongodb = require("mongodb");

module.exports = class Trigger {

    constructor(obj) {

        Object.assign(this, obj);
        this._id = String(obj._id);

        Object.defineProperty(this, "events", {
            value: new EventEmitter,
            enumerable: false,
            configurable: false,
            writable: false
        });

        Object.defineProperty(this, "fired", {
            value: false,
            configurable: true,
            writable: true
        });

        // add this to database schema?!
        Object.assign(this, {
            timestamps: {
                fired: null,
            }
        });

    };

    static schema() {
        return Joi.object({
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return new mongodb.ObjectID();
            }),
            name: Joi.string().required(),
            description: Joi.string().default(""),
            enabled: Joi.boolean().default(true)
        });
    };

    trigger() {

        this.fired = true;
        this.timestamps.fired = Date.now();
        this.events.emit("fired");

    }

};

/*
for (prop in process.binding("natives")) {
    console.log(prop)
}
*/