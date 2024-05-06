const { randomUUID } = require("crypto");
const { EventEmitter } = require("events");
const Joi = require("joi");


const events = new EventEmitter();
const notifications = [];


// `new Set()` would be better, but its not proxyable
// TypeError: Method Set.prototype.add called on incompatible receiver #<Set>
// try it with prop.bind(set/receiver)?
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Called_on_incompatible_type
// > why event the proxy trap? emit the added event when a new notificaiton instance is created
// TODO: test/switch to - with new Set();
/*
const notifications = new Proxy([], {
    set(target, prop, val, receiver) {

        events.emit("added", val);
        return Reflect.set(target, prop, val, receiver);
        //receiver.add(val);

    }
});
*/


module.exports = class Notification {

    constructor(title, message) {

        let { error, value } = Notification.validate({
            title,
            message
        });

        if (error) {
            throw error;
        }

        // set/merge default values
        // TODO: check how to set defaults form schema definition!
        Object.assign(this, {
            timestamps: {
                created: Date.now(),
                published: false
            }
        }, value);

        // hidden property
        Object.defineProperty(this, "published", {
            value: false,
            writable: true
        });

        // add notification
        //notifications.add(this);
        notifications.push(this);
        events.emit("added", this);

    }

    publish() {
        if (!this.published) {

            this.published = true;
            this.timestamps.published = Date.now();

            //if (!this.retain) {
            process.nextTick(() => {

                events.emit("publish", this);
                //notifications.delete(this);

                let index = notifications.find(({ uuid }) => {
                    return this.uuid === uuid;
                });

                notifications.splice(index, 1);

            });
            //}

        }
    }

    static schema() {
        return Joi.object({
            title: Joi.string().required(),
            message: Joi.string().required(),
            uuid: Joi.string().default(() => {
                return randomUUID();
            }),
            type: Joi.string().valid("info", "warn", "error").default("info"),
            //actions: Joi.array().items().default([]),
            //retain: Joi.boolean().default(false),
            timestamps: Joi.object({
                created: Joi.number().allow(null).default(() => {
                    return Date.now();
                }),
                published: Joi.number().allow(null).default(null)
            })
        });
    }

    static validate(data) {
        return Notification.schema().validate(data);
    }

    static events() {
        return events;
    }

    static notifications(convert = false) {
        if (convert) {
            return Array.from(notifications);
        } else {
            return notifications;
        }
    }

};