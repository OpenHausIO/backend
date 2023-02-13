const assert = require("assert");
const mongodb = require("mongodb");

try {

    const C_COMPONENT = require(`../../components/mdns/index.js`);
    const MDNS = require("../../components/mdns/class.mdns.js");

    const workflow = require("./test.workflow.js");

    let _id = String(new mongodb.ObjectId());


    workflow(C_COMPONENT, "add", (done, { event }) => {
        C_COMPONENT.add({
            _id,
            type: "A",
            name: "shelly*.local"
        }, (err, item) => {
            try {

                // check event arguments
                event.args.forEach((args) => {
                    assert.equal(args[0] instanceof MDNS, true);
                });

                assert.ok(err === null);
                assert.equal(item instanceof MDNS, true);

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
                assert.equal(item instanceof MDNS, true);

                done(err);

            } catch (err) {

                done(err);

            }
        });
    });


    workflow(C_COMPONENT, "update", (done) => {
        C_COMPONENT.update(_id, {
            type: "SRV"
        }, (err, item) => {
            try {

                assert.ok(err === null);
                assert.equal(item instanceof MDNS, true);
                assert.equal(item.name, "shelly*.local");

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
                name: `shelly*_tcp.local`
            }),

            // update call 2
            C_COMPONENT.update(_id, {
                name: `shelly*_tcp.local`,
                type: "A"
            }),

        ]).then(() => {

            event.args.forEach((args) => {
                assert.equal(args[0] instanceof MDNS, true);
            });

            done();

        }).catch(done);
    });


    workflow(C_COMPONENT, "remove", (done, { post }) => {
        C_COMPONENT.remove(_id, (err, item) => {
            try {

                // check post arguments item instance
                post.args.forEach((args) => {
                    assert.equal(args[0] instanceof MDNS, true);
                });

                assert.ok(err === null);
                assert.equal(item instanceof MDNS, true);

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