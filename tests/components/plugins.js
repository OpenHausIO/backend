const assert = require("assert");
const mongodb = require("mongodb");

try {

    const C_COMPONENT = require(`../../components/plugins/index.js`);
    const Plugin = require("../../components/plugins/class.plugin.js");

    const workflow = require("./test.workflow.js");

    let _id = String(new mongodb.ObjectId());


    workflow(C_COMPONENT, "add", (done, { event }) => {
        C_COMPONENT.add({
            _id,
            name: "Plugin #1",
            version: 1,
            intents: ["devices", "endpoints", "plugins", "rooms", "ssdp", "store", "users", "vault"]
        }, (err, item) => {
            try {

                // check event arguments
                event.args.forEach((args) => {
                    assert.equal(args[0] instanceof Plugin, true);
                });

                assert.ok(err === null);
                assert.equal(item instanceof Plugin, true);

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
                assert.equal(item instanceof Plugin, true);

                done(err);

            } catch (err) {

                done(err);

            }
        });
    });


    workflow(C_COMPONENT, "update", (done) => {
        C_COMPONENT.update(_id, {
            version: 2
        }, (err, item) => {
            try {

                assert.ok(err === null);
                assert.equal(item instanceof Plugin, true);
                assert.equal(item.version, 2);

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
                version: 3
            }),

            // update call 2
            C_COMPONENT.update(_id, {
                enabled: false
            })

        ]).then(() => {

            event.args.forEach((args) => {
                assert.equal(args[0] instanceof Plugin, true);
            });

            done();

        }).catch(done);
    });


    workflow(C_COMPONENT, "remove", (done, { post }) => {
        C_COMPONENT.remove(_id, (err, item) => {
            try {

                // check post arguments item instance
                post.args.forEach((args) => {
                    assert.equal(args[0] instanceof Plugin, true);
                });

                assert.ok(err === null);
                assert.equal(item instanceof Plugin, true);

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