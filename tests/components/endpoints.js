const assert = require("assert");
const mongodb = require("mongodb");

try {

    const C_COMPONENT = require(`../../components/endpoints/index.js`);
    const Endpoint = require("../../components/endpoints/class.endpoint.js");

    const workflow = require("./test.workflow.js");

    let _id = String(new mongodb.ObjectId());
    let _device = String(new mongodb.ObjectId());


    workflow(C_COMPONENT, "add", (done, { event }) => {
        C_COMPONENT.add({
            _id,
            name: "Endpoint #1",
            device: _device
        }, (err, item) => {
            try {

                // check event arguments
                event.args.forEach((args) => {
                    assert.equal(args[0] instanceof Endpoint, true);
                });

                assert.ok(err === null);
                assert.equal(item instanceof Endpoint, true);

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
                assert.equal(item instanceof Endpoint, true);

                done(err);

            } catch (err) {

                done(err);

            }
        });
    });


    workflow(C_COMPONENT, "update", (done) => {
        C_COMPONENT.update(_id, {
            name: "Endpoint #2 - updated"
        }, (err, item) => {
            try {

                assert.ok(err === null);
                assert.equal(item instanceof Endpoint, true);
                assert.equal(item.name, "Endpoint #2 - updated");

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
                    assert.equal(args[0] instanceof Endpoint, true);
                });

                assert.ok(err === null);
                assert.equal(item instanceof Endpoint, true);

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