const mongodb = require("mongodb");
const Joi = require("joi");

//const logger = require("../../system/logger").create("rooms");
//const COMMON_COMPONENT = require("../../system/component/common.js");
const COMPONENT = require("../../system/component/class.component.js");

const SSDP = require("./class.ssdp.js");

/**
 * @description
 * Listen for ssdp message and sends discovery requests<br />
 * 
 * @class C_SSDP
 * @extends COMPONENT system/component/class.component.js
 * 
 * @emits message Received message on udp socket; Arguments: [0]=message type, [1]=headers
 * 
 * @link router.api.ssdp.js routes/router.api.ssdp
 * @see https://en.wikipedia.org/wiki/Simple_Service_Discovery_Protocol
 * 
 * @example
 * ```sh
 * socat UDP4-RECVFROM:1900,ip-add-membership=239.255.255.250:0.0.0.0,fork - | wscat --connect=ws://127.0.0.1:8080/api/ssdp
 * ```
 * 
 * @example
 * ```json
 * {
 *  host: '239.255.255.250:1900',
 *  man: '"ssdp:discover"',
 *  st: 'upnp:rootdevice',
 *  mx: '5'
 * }
 * ```
 */
class C_SSDP extends COMPONENT {

    constructor() {

        // inject logger, collection and schema object
        super("ssdp", {
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return new mongodb.ObjectID();
            }),
            description: Joi.string().allow(null).default(null),
            nt: Joi.string().required()
        }, module);

        this.hooks.post("add", (data, next) => {
            next(null, new SSDP(data));
        });

        this.events.on("message", (type, headers) => {

            // feedback
            this.logger.trace(`Message received on udp socket, type: "${type}"`, headers);

        });

    }

}


// create component instance
const instance = module.exports = new C_SSDP();


// init component
// set items/build cache
instance.init((scope, ready) => {
    scope.collection.find({}).toArray((err, data) => {
        if (err) {

            // shit...
            ready(err);

        } else {

            data = data.map((obj) => {
                return new SSDP(obj);
            });

            scope.items.push(...data);

            // init done
            ready(null);

        }
    });
});