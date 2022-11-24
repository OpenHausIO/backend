const assert = require("assert");
const mongodb = require("mongodb");
const { v4: uuidv4 } = require("uuid");

try {

    const C_COMPONENT = require(`../../components/store/index.js`);
    const Store = require("../../components/store/class.store.js");

    const workflow = require("./test.workflow.js");

    let _id = String(new mongodb.ObjectId());
    let namespace = String(new mongodb.ObjectId());

    workflow(C_COMPONENT, "add", (done, { event }) => {
        C_COMPONENT.add({
            _id,
            config: [{
                key: "key",
                type: "string",
                description: "Test key"
            }],
            namespace
        }, (err, item) => {

            // check event arguments
            event.args.forEach((args) => {
                assert.equal(args[0] instanceof Store, true);
            });

            assert.ok(err === null);
            assert.equal(item instanceof Store, true);

            done(err);

        });
    });


    workflow(C_COMPONENT, "get", (done) => {
        C_COMPONENT.get(_id, (err, item) => {
            try {

                assert.ok(err === null);
                assert.equal(item instanceof Store, true);

                done(err);

            } catch (err) {

                done(err);

            }
        });
    });


    workflow(C_COMPONENT, "update", (done) => {

        let uuid = uuidv4();

        C_COMPONENT.update(_id, {
            item: uuid
        }, (err, item) => {
            try {

                assert.ok(err === null);
                assert.equal(item instanceof Store, true);
                assert.equal(item.item, uuid);

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
                item: uuidv4()
            }),

            // update call 2
            C_COMPONENT.update(_id, {
                item: uuidv4()
            })

        ]).then(() => {

            event.args.forEach((args) => {
                assert.equal(args[0] instanceof Store, true);
            });

            done();

        }).catch(done);
    });


    workflow(C_COMPONENT, "remove", (done, { post }) => {
        C_COMPONENT.remove(_id, (err, item) => {
            try {

                // check post arguments item instance
                post.args.forEach((args) => {
                    assert.equal(args[0] instanceof Store, true);
                });

                assert.ok(err === null);
                assert.equal(item instanceof Store, true);

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