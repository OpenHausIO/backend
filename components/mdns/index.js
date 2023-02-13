const mongodb = require("mongodb");
const Joi = require("joi");

//const logger = require("../../system/logger").create("rooms");
//const COMMON_COMPONENT = require("../../system/component/common.js");
const COMPONENT = require("../../system/component/class.component.js");

const MDNS = require("./class.mdns.js");

const messageHandler = require("./message-handler.js");

/**
 * @description
 * Listen for mdns message and sends query requests.<br />
 * This requires the "connector".
 * 
 * The emitted message events is the parsed data received on the underlaying udp socket.
 * 
 * @class C_MDNS
 * @extends COMPONENT system/component/class.component.js
 * 
 * @emits message Received message on udp socket; Arguments: [0]=parsed dns packet, [1]=raw udp message
 * 
 * @link router.api.mdns.js routes/router.api.mdns.js
 * @see https://en.wikipedia.org/wiki/Multicast_DNS
 * @see https://www.npmjs.com/package/dns-packet
 */
class C_MDNS extends COMPONENT {

    constructor() {

        // inject logger, collection and schema object
        super("mdns", {
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return String(new mongodb.ObjectId());
            }),
            name: Joi.string().required(),
            type: Joi.string().valid("SRV", "PTR", "A", "AAAA").default("A"),
            timestamps: {
                announced: Joi.number().allow(null).default(null)
            }
        }, module);

        this.hooks.post("add", (data, next) => {
            next(null, new MDNS(data));
        });

        this.collection.createIndex({
            name: 1,
            type: 1
        }, {
            unique: true
        });

        // handle incoming messages
        // triggers registerd callback for mdns items
        messageHandler(this);

    }

}


// create component instance
const instance = module.exports = new C_MDNS();


// init component
// set items/build cache
instance.init((scope, ready) => {
    scope.collection.find({}).toArray((err, data) => {
        if (err) {

            // shit...
            ready(err);

        } else {

            data = data.map((obj) => {
                return new MDNS(obj);
            });

            scope.items.push(...data);

            // init done
            ready(null);

        }
    });
});