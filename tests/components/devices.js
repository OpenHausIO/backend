const assert = require("assert");
const mongodb = require("mongodb");

try {

    const C_COMPONENT = require(`../../components/devices/index.js`);
    const Device = require("../../components/devices/class.device.js");

    const workflow = require("./test.workflow.js");

    let _id = String(new mongodb.ObjectId());


    workflow(C_COMPONENT, "add", (done) => {
        C_COMPONENT.add({
            _id,
            name: "Device #1",
            interfaces: [{
                type: "ETHERNET",
                settings: {
                    socket: "tcp",
                    host: "127.0.0.1",
                    port: 54321
                }
            }]
        }, (err, item) => {
            try {

                assert.ok(err === null);
                assert.equal(item instanceof Device, true);

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
                assert.equal(item instanceof Device, true);

                done(err);

            } catch (err) {

                done(err);

            }
        });
    });


    workflow(C_COMPONENT, "update", (done) => {
        C_COMPONENT.update(_id, {
            _id,
            interfaces: [{
                type: "ETHERNET",
                settings: {
                    socket: "tcp",
                    host: "127.0.0.2",
                    port: 54321
                }
            }]
        }, (err, item) => {
            try {

                assert.ok(err === null);
                assert.equal(item instanceof Device, true);
                assert.equal(item.interfaces[0].settings.host, "127.0.0.2");

                done(err);

            } catch (err) {

                done(err);

            }
        });
    });


    workflow(C_COMPONENT, "remove", (done, { post }) => {
        C_COMPONENT.remove(_id, (err, item) => {
            try {

                // check post arguments item instance
                post.args.forEach((args) => {
                    assert.equal(args[0] instanceof Device, true);
                });

                assert.ok(err === null);
                assert.equal(item instanceof Device, true);

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