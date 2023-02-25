/**
 * @description
 * Represents a webhook item
 * 
 * @class Webhook
 * 
 * @param {Object} obj Object that matches the item schema. See properties below:
 * 
 * @property {String} _id MongoDB Object is as string
 * @property {String} name Webhook name
 */
module.exports = class Webhook {

    constructor(obj) {

        Object.assign(this, obj);
        this._id = String(obj._id);

        Object.defineProperty(this, "_handler", {
            value: [],
            configurable: false,
            enumerable: false,
            writable: false
        });

        Object.defineProperty(this, "_trigger", {
            value: (body, query) => {

                this._handler.forEach((cb) => {
                    cb(body, query);
                });

            },
            enumerable: false,
            configurable: false,
            writable: false
        });

    }

    handle(cb) {
        this._handler.push(cb);
    }

};