const Item = require("../../system/component/class.item.js");

module.exports = class SSDP extends Item {

    constructor(obj) {

        super(obj);

        // removed for #356
        //Object.assign(this, obj);
        //this._id = String(obj._id);

        Object.defineProperty(this, "_matches", {
            value: [],
            writable: false,
            configurable: false,
            enumerable: false
        });

    }

    match(cb) {
        this._matches.push(cb);
    }

};