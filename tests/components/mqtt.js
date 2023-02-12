const assert = require("assert");
const mongodb = require("mongodb");

try {

    const C_COMPONENT = require(`../../components/mqtt/index.js`);
    const MQTT = require("../../components/mqtt/class.mqtt.js");

    const workflow = require("./test.workflow.js");

    let _id = String(new mongodb.ObjectId());


    workflow(C_COMPONENT, "add", (done, { event }) => {
        C_COMPONENT.add({
            _id,
            topic: "air-sensor/",
        }, (err, item) => {
            try {

                // check event arguments
                event.args.forEach((args) => {
                    assert.equal(args[0] instanceof MQTT, true);
                });

                assert.ok(err === null);
                assert.equal(item instanceof MQTT, true);
                assert.ok(item._publisher);
                assert.ok(item._subscriber);
                assert.equal(item.subscribe instanceof Function, true);
                assert.equal(item.publish instanceof Function, true);

                done(err);

            } catch (err) {

                done(err);

            }
        });
    });


    workflow(C_COMPONENT, "get", (done) => {
        C_COMPONENT.get(_id, (err, item) => {
            try {

                assert.ok(err === null);
                assert.equal(item instanceof MQTT, true);

                done(err);

            } catch (err) {

                done(err);

            }
        });
    });


    workflow(C_COMPONENT, "update", (done) => {
        C_COMPONENT.update(_id, {
            topic: "air-sensor/sensor/particulate_matter_25m_concentration/state"
        }, (err, item) => {
            try {

                assert.ok(err === null);
                assert.equal(item instanceof MQTT, true);
                assert.equal(item.topic, "air-sensor/sensor/particulate_matter_25m_concentration/state");
                assert.ok(item._publisher);
                assert.ok(item._subscriber);
                assert.equal(item.subscribe instanceof Function, true);
                assert.equal(item.publish instanceof Function, true);

                done(err);

            } catch (err) {

                done(err);

            }
        });
    });


    workflow(C_COMPONENT, "update", "Double update result / event arguments check", (done, { event }) => {
        Promise.all([

            // update call 1
            C_COMPONENT.update(_id, {
                topic: `air-sensor/status`
            }),

            // update call 2
            C_COMPONENT.update(_id, {
                topic: `air-sensor/`,
                description: "Ikea VINDRIKTNING Air sensor MQTT topic"
            }),

        ]).then(() => {

            event.args.forEach((args) => {
                assert.equal(args[0] instanceof MQTT, true);
            });

            done();

        }).catch(done);
    });


    workflow(C_COMPONENT, "remove", (done, { post }) => {
        C_COMPONENT.remove(_id, (err, item) => {
            try {

                // check post arguments item instance
                post.args.forEach((args) => {
                    assert.equal(args[0] instanceof MQTT, true);
                });

                assert.ok(err === null);
                assert.equal(item instanceof MQTT, true);

                done(err);

            } catch (err) {

                done(err);

            }
        });
    });


} catch (err) {
    console.error(err);
    process.exit(100);
}