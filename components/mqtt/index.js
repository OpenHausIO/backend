//const logger = require("../../system/logger").create("rooms");
//const COMMON_COMPONENT = require("../../system/component/common.js");
const COMPONENT = require("../../system/component/class.component.js");

const MQTT = require("./class.mqtt.js");

const messageHandler = require("./message-handler.js");
//const packetHandler = require("./packet-handler.js");

/**
 * @description 
 * Receives MQTT messages from broker.<br />
 * It can publish and subscribe to topics.
 * The emitted events are a mix from mqtt & custom ones.
 * 
 * NOTE: Currenlty no authentication is possible.
 * 
 * @class C_MQTT
 * @extends COMPONENT system/component/class.component.js
 * 
 * @emits message Received message over websocket/tcp connection; Arguments: [0] = tcp message
 * @emits connect
 * @emits connack
 * @emits subscribe
 * @emits suback
 * @emits unsubscribe
 * @emits unsuback
 * @emits publish Something was published; Arguments: [0] = payload (buffer); [1] = parsed packet
 * @emits puback
 * @emits pubrec
 * @emits pubrel
 * @emits pubcomp
 * @emits pingreq Ping request
 * @emits pingresp Ping response
 * @emits disconnect
 * @emits auth
 * @emits connected When websocket connected; Arguments: [0] = WebSocket client object "ws"
 * @emits disconnected When websocket disconnected; Arguments: [0] = WebSocket client object "ws"
 * 
 * @link router.api.mqtt.js routes/router.api.mqtt.js
 * @see https://en.wikipedia.org/wiki/MQTT
 * @see https://www.npmjs.com/package/mqtt-packet
 */
class C_MQTT extends COMPONENT {

    constructor() {

        // inject logger, collection and schema object
        super("mqtt", MQTT.schema(), module);

        this.hooks.post("add", (data, next) => {
            next(null, new MQTT(data));
        });

        this.collection.createIndex({
            topic: 1
        }, {
            unique: true
        });

        // handle incoming messages
        // triggers registerd callback for mdns items
        messageHandler(this);
        //packetHandler(this);

    }

}


// create component instance
const instance = module.exports = new C_MQTT();


// init component
// set items/build cache
instance.init((scope, ready) => {
    scope.collection.find({}).toArray((err, data) => {
        if (err) {

            // shit...
            ready(err);

        } else {

            data = data.map((obj) => {
                return new MQTT(obj);
            });

            scope.items.push(...data);

            // init done
            ready(null);

        }
    });
});