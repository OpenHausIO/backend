const assert = require("assert");
const mongodb = require("mongodb");

try {

    const C_COMPONENT = require(`../../components/webhooks/index.js`);
    const Webhook = require("../../components/webhooks/class.webhook.js");

    const workflow = require("./test.workflow.js");

    let _id = String(new mongodb.ObjectId());


    workflow(C_COMPONENT, "add", (done, { event }) => {
        C_COMPONENT.add({
            _id,
            name: "Webhook #1",
        }, (err, item) => {
            try {

                // check event arguments
                event.args.forEach((args) => {
                    assert.equal(args[0] instanceof Webhook, true);
                });

                assert.ok(err === null);
                assert.equal(item instanceof Webhook, true);
                assert.equal(item._handler instanceof Array, true);
                assert.equal(item._trigger instanceof Function, true);

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
                assert.equal(item instanceof Webhook, true);

                done(err);

            } catch (err) {

                done(err);

            }
        });
    });


    workflow(C_COMPONENT, "update", (done) => {
        C_COMPONENT.update(_id, {
            name: "Webhook #1 - updated",
        }, (err, item) => {
            try {

                assert.ok(err === null);
                assert.equal(item instanceof Webhook, true);
                assert.equal(item._handler instanceof Array, true);
                assert.equal(item._trigger instanceof Function, true);
                assert.equal(item.name, "Webhook #1 - updated");

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
                name: "New name",
            }),

            // update call 2
            C_COMPONENT.update(_id, {
                name: "New name - updated",
            })

        ]).then(() => {

            event.args.forEach((args) => {
                assert.equal(args[0] instanceof Webhook, true);
            });

            done();

        }).catch(done);
    });


    workflow(C_COMPONENT, "remove", (done, { post }) => {
        C_COMPONENT.remove(_id, (err, item) => {
            try {

                // check post arguments item instance
                post.args.forEach((args) => {
                    assert.equal(args[0] instanceof Webhook, true);
                });

                assert.ok(err === null);
                assert.equal(item instanceof Webhook, true);

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