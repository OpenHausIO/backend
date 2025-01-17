const Joi = require("joi");
const mongodb = require("mongodb");

const Item = require("../../system/component/class.item.js");

// simple mdns monitor:
// nc -ulvv 224.0.0.251 5353  -> does not work, use socat below:
// socat UDP4-RECVFROM:5353,ip-add-membership=224.0.0.0:0.0.0.0,fork,reuseaddr -
// sudo tcpdump -i <eth0> udp port 5353
// sudo tcpdump -i eno1 udp port 5353
// TODO: Add documentation for class
module.exports = class MDNS extends Item {

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
            name: Joi.string().required(),
            type: Joi.string().valid("SRV", "PTR", "A", "AAAA").default("A"),
            timestamps: {
                announced: Joi.number().allow(null).default(null)
            }
        });
    }

    static validate(data) {
        return MDNS.schema().validate(data);
    }

    match(cb) {
        this._matches.push(cb);
    }

};