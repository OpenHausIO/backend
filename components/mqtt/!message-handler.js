const crypto = require("crypto");
const mqtt = require("mqtt-packet");

const VERSION = Number(process.env.MQTT_BROKER_VERSION);

const parser = mqtt.parser({
    protocolVersion: VERSION
});

const exitCodes = require("./exit-codes.js")(VERSION);

module.exports = (scope) => {
    scope._ready(({ logger, events }) => {

        // ping timer
        let interval = null;

        events.on("publish", (packet) => {
            scope.items.forEach(({ topic, _subscriber }) => {

                if (String(packet.topic).startsWith(topic) || packet.topic === topic) {
                    _subscriber.forEach((cb) => {
                        cb(packet.payload, packet);
                    });
                }

            });
        });


        events.on("connected", (ws) => {

            logger.debug("TCP socket connected to broker");

            events.once("disconnected", () => {
                clearInterval(interval);
                logger.trace("Ping interval cleared");
            });

            // TODO make this object configurable
            let data = mqtt.generate({
                cmd: "connect",
                protocolId: "MQTT", // Or "MQIsdp" in MQTT 3.1 and 5.0
                protocolVersion: VERSION, // Or 3 in MQTT 3.1, or 5 in MQTT 5.0
                clean: true, // Can also be false
                clientId: process.env.MQTT_CLIENT_ID,
                keepalive: 10, // Seconds which can be any positive number, with 0 as the default setting
                /*
                will: {
                    topic: "mydevice/test",
                    payload: Buffer.from("2134f"), // Payloads are buffers
    
                }
                */
            });

            ws.send(data);

            events.once("connack", (packet) => {
                if (packet.returnCode === 0) {

                    events.once("suback", () => {

                        logger.debug("Subscribed to topic #");

                        let ping = mqtt.generate({
                            cmd: "pingreq"
                        });

                        interval = setInterval(() => {
                            ws.send(ping);
                        }, Number(process.env.MQTT_PING_INTERVAL));

                        // monkey patch publisher function
                        scope.items.forEach((item) => {
                            item._publisher = (payload) => {

                                scope.logger.verbose(`Publish on topic ${item.topic}`, payload);

                                let pub = mqtt.generate({
                                    cmd: "publish",
                                    messageId: crypto.randomInt(0, 65535),
                                    qos: 0,
                                    dup: false,
                                    topic: item.topic,
                                    payload: Buffer.from(`${payload}`),
                                    retain: false
                                });

                                ws.send(pub);

                            };
                        });

                    });

                    let sub = mqtt.generate({
                        cmd: "subscribe",
                        messageId: crypto.randomInt(0, 65535),
                        /*
                        properties: { // MQTT 5.0 properties
                            subscriptionIdentifier: 145,
                            userProperties: {
                                test: "shellies"
                            }
                        },
                        */
                        subscriptions: [{
                            topic: "#",
                            qos: 0,
                            nl: false, // no Local MQTT 5.0 flag
                            rap: true, // Retain as Published MQTT 5.0 flag
                            rh: 1 // Retain Handling MQTT 5.0
                        }]
                    });

                    ws.send(sub);

                }
            });

        });


        parser.on("packet", (packet) => {

            logger.verbose("Packet received", packet);

            if (packet.cmd === "connack") {
                if (packet.returnCode == 0) {

                    logger.debug("Connected to broker");

                } else {

                    logger.warn(`Could not connecto to broker: "${exitCodes[packet.returnCode]}"`);

                }
            }

            events.emit(packet.cmd, packet);

        });


        events.on("message", (message) => {
            parser.parse(message);
        });

    });
};