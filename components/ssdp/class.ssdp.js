const Joi = require("joi");
const mongodb = require("mongodb");

const Item = require("../../system/component/class.item.js");

// simple ssdp monitor:
// nc -ulvv 239.255.255.250 1900 -> does not work, use socat below:
// socat UDP4-RECVFROM:1900,ip-add-membership=239.255.255.250:0.0.0.0,fork,reuseaddr -
// sudo tcpdump -i <eth0> udp port 1900
// sudo tcpdump -i eno1 udp port 1900
// TODO: Add documentation for class
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

    static schema() {
        return Joi.object({
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return String(new mongodb.ObjectId());
            }),
            description: Joi.string().allow(null).default(null),
            nt: Joi.string().allow(null).default(null),
            usn: Joi.string().allow(null).default(null),
            // NOTE: Removed head field since currently no unique index can be build with it
            //headers: Joi.array().items(Joi.string()).allow(null).default([]),
            timestamps: {
                announced: Joi.number().allow(null).default(null)
            }
        });
    }

    static validate(data) {
        return SSDP.schema().validate(data);
    }

    match(cb) {
        this._matches.push(cb);
    }

};