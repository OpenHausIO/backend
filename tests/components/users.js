const assert = require("assert");
const mongodb = require("mongodb");

try {

    const C_COMPONENT = require(`../../components/users/index.js`);
    const User = require("../../components/users/class.user.js");

    const workflow = require("./test.workflow.js");

    let _id = String(new mongodb.ObjectId());


    workflow(C_COMPONENT, "add", (done, { event }) => {
        C_COMPONENT.add({
            _id,
            name: "Marc Stirner",
            email: "marc.stirner@example.com",
            password: "Pa$$w0rd"
        }, (err, item) => {
            try {

                // check event arguments
                event.args.forEach((args) => {
                    assert.equal(args[0] instanceof User, true);
                });

                assert.ok(err === null);
                assert.equal(item instanceof User, true);

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
                assert.equal(item instanceof User, true);

                done(err);

            } catch (err) {

                done(err);

            }
        });
    });


    workflow(C_COMPONENT, "update", (done) => {
        C_COMPONENT.update(_id, {
            enabled: true,
            labels: [
                "expires=29991231"
            ]
        }, (err, item) => {
            try {

                assert.ok(err === null);
                assert.equal(item instanceof User, true);
                assert.equal(item.enabled, true);

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
                password: "12345678",
                labels: [
                    "expires=29991231",
                    "key=value"
                ]
            }),

            // update call 2
            C_COMPONENT.update(_id, {
                enabled: true
            })

        ]).then(() => {

            event.args.forEach((args) => {
                assert.equal(args[0] instanceof User, true);
            });

            done();

        }).catch(done);
    });


    workflow(C_COMPONENT, "remove", (done, { post }) => {
        C_COMPONENT.remove(_id, (err, item) => {
            try {

                // check post arguments item instance
                post.args.forEach((args) => {
                    assert.equal(args[0] instanceof User, true);
                });

                assert.ok(err === null);
                assert.equal(item instanceof User, true);

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