//const logger = require("../../system/logger").create("rooms");
//const COMMON_COMPONENT = require("../../system/component/common.js");
const COMPONENT = require("../../system/component/class.component.js");

const SSDP = require("./class.ssdp.js");

const messageHandler = require("./message-handler.js");

/**
 * @description
 * Listen for ssdp message and sends discovery requests.<br />
 * This requires the "connector" software or bridging via other tools.<br />
 * A example for bridging can you see below with `socat` & `wscat`.
 * 
 * The emitted message events is the parsed data received on the underlaying udp socket.<br />
 * As third parameter the content of the `LOCATION` header field can be seen.<br />
 * This is only available if the connector is used.
 * 
 * @class C_SSDP
 * @extends COMPONENT system/component/class.component.js
 * 
 * @emits message Received message on udp socket; Arguments: [0]=message type, [1]=headers, [2]=body (location header url content as json)
 * 
 * @example
 * ```sh
 * socat UDP4-RECVFROM:1900,ip-add-membership=239.255.255.250:0.0.0.0,fork - | wscat --connect=ws://127.0.0.1:8080/api/ssdp
 * ```
 * 
 * @example
 * ```sh
 * nc -ulvv 239.255.255.250 1900
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
 * 
 * @link router.api.ssdp.js routes/router.api.ssdp.js
 * @see https://en.wikipedia.org/wiki/Simple_Service_Discovery_Protocol
 * @see https://github.com/nashwaan/xml-js
 */
class C_SSDP extends COMPONENT {

    constructor() {

        // inject logger, collection and schema object
        super("ssdp", SSDP.schema());

        this.hooks.post("add", (data, next) => {
            next(null, new SSDP(data));
        });

        this.collection.createIndex({
            usn: 1,
            nt: 1
        }, {
            unique: true
        });

        // handle incoming messages
        // triggers registerd callback for ssdp items
        messageHandler(this);

    }

}


// create component instance
const instance = module.exports = new C_SSDP();


// init component
// set items/build cache
instance.init((scope, ready) => {
    scope.collection.find({}).toArray().then((data) => {

        data.forEach((obj) => {

            let item = new SSDP(obj);
            scope.items.push(item);

        });

        // init done
        ready(null);

    }).catch((err) => {

        ready(err);

    });
});