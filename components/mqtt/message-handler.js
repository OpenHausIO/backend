const crypto = require("crypto");
const mqtt = require("mqtt-packet");

const VERSION = Number(process.env.MQTT_BROKER_VERSION);
const exitCodes = require("./exit-codes.js")(VERSION);

const _debounce = require("../../helper/debounce.js");
const { isMainThread } = require("worker_threads");

const parser = mqtt.parser({
    protocolVersion: VERSION
});

module.exports = (scope) => {
    scope._ready(({ logger, events, items, update }) => {

        // ping setTimeout timer
        let interval = null;

        let updater = _debounce(async (topic) => {
            try {

                // trigger update on item
                await update(topic._id, topic);

                // feedback
                logger.verbose(`Topic timestamp "published" updated`, topic);

            } catch (err) {

                logger.warn(err, "Could not update topic item after debouncing");

            }
        }, 100);


        let publisher = (item) => {
            return (payload, options = {}) => {

                // feedback
                logger.verbose(`Publish on topic ${item.topic}`, payload);

                let pub = mqtt.generate({
                    cmd: "publish",
                    messageId: crypto.randomInt(0, 65535),
                    qos: 0,
                    dup: false,
                    topic: item.topic,
                    payload: Buffer.from(payload),
                    retain: false,
                    ...options
                });

                // helper event for publishing
                // listener registerd in router.api.mqtt.js
                events.emit("transmit", pub, item, payload);

            };
        };


        // listen for published topics
        // call publish handler on each mqtt item
        events.on("publish", (packet) => {

            // feedback
            logger.trace(`Published: ${packet.topic}=${packet.payload}`);

            items.forEach(({ topic, _subscriber }, index) => {
                if (String(packet.topic).startsWith(topic) || packet.topic === topic) {

                    let item = items[index];
                    let { timestamps } = item;

                    /*
                    // when value should be stored
                    // prevent useless set when value is the same as previous one
                    // same should be for published timestamp
                    if (topic.value !== packet.payload) {

                        topic.value = Number(packet.payload);
                        timestamps.published = Date.now();

                        console.log("Published", topic, packet.payload)

                        _subscriber.forEach((cb) => {
                            cb(packet.payload, packet);
                        });

                        process.nextTick(updater, topic);

                    }
                    */

                    // convert Uint8Array serilaized array back
                    if (!isMainThread) {
                        packet.payload = Buffer.from(packet.payload);
                    }

                    timestamps.published = Date.now();

                    _subscriber.forEach((cb) => {
                        cb(packet.payload, packet);
                    });

                    if (isMainThread) {
                        process.nextTick(updater, item);
                    }

                }
            });

        });


        events.on("add", (item) => {
            item._publisher = publisher(item);
        });

        items.forEach((item) => {
            item._publisher = publisher(item);
        });


        // "connected" fires every time a websocket connection is made, e.g. from a connector. 
        // So we need to react and create a new connection to the browker
        if (isMainThread) {
            events.on("connected", async (ws) => {
                try {

                    // connecto to broker
                    // TODO: Add here credentials for authentication
                    await new Promise((resolve, reject) => {

                        logger.debug("Connect to broker...");

                        let data = mqtt.generate({
                            cmd: "connect",
                            protocolId: "MQTT",
                            protocolVersion: VERSION,
                            clean: true,
                            clientId: process.env.MQTT_CLIENT_ID,
                            keepalive: 10
                        });

                        ws.send(data, () => {
                            parser.once("packet", ({ cmd, returnCode }) => {
                                if (cmd === "connack" && returnCode === 0) {

                                    // feedback
                                    logger.info("Connected to broker");

                                    resolve();

                                } else {
                                    reject(new Error(exitCodes[returnCode]));
                                }
                            });
                        });

                    });


                    // subscribe to # topic
                    // so we can handle all topics
                    await new Promise((resolve, reject) => {

                        // feedback
                        logger.verbose("[MQTT] Subscribe to # topic...");

                        let data = mqtt.generate({
                            cmd: "subscribe",
                            messageId: crypto.randomInt(0, 65535),
                            subscriptions: [{
                                topic: "#",
                                //topic: "#",
                                qos: 0,
                                nl: false, // no Local MQTT 5.0 flag
                                rap: true, // Retain as Published MQTT 5.0 flag
                                rh: 1 // Retain Handling MQTT 5.0
                            }]
                        });

                        ws.send(data, () => {
                            parser.once("packet", ({ cmd, granted }) => {
                                if (cmd === "suback" && granted[0] === 0) {

                                    // feedback
                                    logger.debug("Subscribed to # topic");

                                    resolve();

                                } else {
                                    reject(new Error("Subscription not granted"));
                                }
                            });
                        });

                    });


                    // listen for publishes and other packates
                    // send ping requests regulary to broker
                    await new Promise((resolve) => {

                        let ping = mqtt.generate({
                            cmd: "pingreq"
                        });

                        // TODO: store interval in array/set
                        // multiple connections = multiple pings
                        // TODO: unref timer
                        interval = setInterval(() => {
                            ws.send(ping);
                        }, Number(process.env.MQTT_PING_INTERVAL));

                        resolve();

                    });

                } catch (err) {

                    // feedback
                    logger.error(err, "Could not setup MQTT broker handling");

                }
            });
        }


        // listen for disconnects from the connector
        // clear the ping requests intveral, cant reach broker
        events.on("disconnected", () => {
            logger.warn("Disconnected from broker");
            clearInterval(interval);
        });


        // re-emit events on component scope/events
        if (isMainThread) {
            parser.on("packet", (packet) => {
                scope.events.emit(packet.cmd, packet);
            });
        }

        // handle messages from the websockt as mqtt packets
        events.on("message", (msg) => {
            parser.parse(msg);
        });

    });
};