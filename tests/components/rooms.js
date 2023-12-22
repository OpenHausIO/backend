const assert = require("assert");
const mongodb = require("mongodb");

try {

    const C_COMPONENT = require(`../../components/rooms/index.js`);
    const Room = require("../../components/rooms/class.room.js");

    const workflow = require("./test.workflow.js");

    let _id = String(new mongodb.ObjectId());


    workflow(C_COMPONENT, "add", (done, { event }) => {
        C_COMPONENT.add({
            _id,
            name: "Room #1",
            floor: 1,
            labels: [
                "foo=bar",
                "baz=true"
            ]
        }, (err, item) => {
            try {

                // check event arguments
                event.args.forEach((args) => {
                    assert.equal(args[0] instanceof Room, true);
                });

                assert.ok(err === null);
                assert.equal(item instanceof Room, true);

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
                assert.equal(item instanceof Room, true);

                done(err);

            } catch (err) {

                done(err);

            }
        });
    });


    workflow(C_COMPONENT, "update", (done) => {
        C_COMPONENT.update(_id, {
            name: "Room #1 - updated",
            floor: 5
        }, (err, item) => {
            try {

                assert.ok(err === null);
                assert.equal(item instanceof Room, true);
                assert.equal(item.floor, 5);

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
                floor: 2
            }),

            // update call 2
            C_COMPONENT.update(_id, {
                floor: 9,
                number: 42069
            })

        ]).then(() => {

            event.args.forEach((args) => {
                assert.equal(args[0] instanceof Room, true);
            });

            done();

        }).catch(done);
    });


    workflow(C_COMPONENT, "remove", (done, { post }) => {
        C_COMPONENT.remove(_id, (err, item) => {
            try {

                // check post arguments item instance
                post.args.forEach((args) => {
                    assert.equal(args[0] instanceof Room, true);
                });

                assert.ok(err === null);
                assert.equal(item instanceof Room, true);

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