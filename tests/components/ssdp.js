const assert = require("assert");
const mongodb = require("mongodb");

try {

    const C_COMPONENT = require(`../../components/ssdp/index.js`);
    const SSDP = require("../../components/ssdp/class.ssdp.js");

    const workflow = require("./test.workflow.js");

    let _id = String(new mongodb.ObjectId());


    workflow(C_COMPONENT, "add", (done) => {
        C_COMPONENT.add({
            _id,
        }, (err, item) => {
            try {

                assert.ok(err === null);
                assert.equal(item instanceof SSDP, true);

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
                assert.equal(item instanceof SSDP, true);

                done(err);

            } catch (err) {

                done(err);

            }
        });
    });


    workflow(C_COMPONENT, "update", (done) => {
        C_COMPONENT.update(_id, {
            usn: "uuid:f91b07f6-66b5-11ed-93f0-2f945bff9869"
        }, (err, item) => {
            try {

                assert.ok(err === null);
                assert.equal(item instanceof SSDP, true);
                assert.equal(item.usn, "uuid:f91b07f6-66b5-11ed-93f0-2f945bff9869");

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
                    assert.equal(args[0] instanceof SSDP, true);
                });

                assert.ok(err === null);
                assert.equal(item instanceof SSDP, true);

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