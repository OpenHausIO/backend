const assert = require("assert");
const mongodb = require("mongodb");

try {

    const C_COMPONENT = require(`../../components/scenes/index.js`);
    const Scene = require("../../components/scenes/class.scene.js");

    const workflow = require("./test.workflow.js");

    let _id = String(new mongodb.ObjectId());


    workflow(C_COMPONENT, "add", (done, { event }) => {
        C_COMPONENT.add({
            _id,
            name: "Evening",
            makros: [{
                type: "command",
                endpoint: "63a0ce5b33d59ec69d8ffe18",
                command: "63a0ce5b33d59ec69d8ffe19"
            }, {
                type: "command",
                endpoint: "63a1753f44427ef1a83426bf",
                command: "63a1753f44427ef1a83426c0"
            }, {
                type: "timer",
                value: 10000
            }, {
                type: "command",
                endpoint: "63a1753f44427ef1a83426af",
                command: "63a1753f44427ef1a83426b0"
            }]
        }, (err, item) => {
            try {

                // WORKER_TRHEAD_ENABLED=true
                // NOTE: args[0] = serialized object, and not instance of Scene
                // is this maybe fixed when pre/post hooks are implemented?,
                // see: https://github.com/OpenHausIO/backend/issues/6#issuecomment-2932114069                

                // check event arguments
                event.args.forEach((args) => {
                    assert.equal(args[0] instanceof Scene, true);
                });

                assert.ok(err === null);
                assert.equal(item instanceof Scene, true);

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
                assert.equal(item instanceof Scene, true);

                done(err);

            } catch (err) {

                done(err);

            }
        });
    });


    workflow(C_COMPONENT, "update", (done) => {
        C_COMPONENT.update(_id, {
            makros: [{
                type: "command",
                endpoint: "63a1753f44427ef1a83426bf",
                command: "63a1753f44427ef1a83426c0"
            }, {
                type: "timer",
                value: 5000
            }, {
                type: "command",
                endpoint: "63a1753f44427ef1a83426af",
                command: "63a1753f44427ef1a83426b0"
            }]
        }, (err, item) => {
            try {

                assert.ok(err === null);
                assert.equal(item instanceof Scene, true);
                assert.equal(item.makros[1].value, 5000);

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
                name: "Evening"
            }),

            // update call 2
            C_COMPONENT.update(_id, {
                name: "Sunnset"
            })

        ]).then(() => {

            // see comment above for "add"
            // WORKER_TRHEAD_ENABLED=true
            event.args.forEach((args) => {
                assert.equal(args[0] instanceof Scene, true);
            });

            done();

        }).catch((err) => {

            console.log(err);
            done(err);

        });
    });


    workflow(C_COMPONENT, "remove", (done, { post }) => {
        C_COMPONENT.remove(_id, (err, item) => {
            try {

                // check post arguments item instance
                post.args.forEach((args) => {
                    assert.equal(args[0] instanceof Scene, true);
                });

                assert.ok(err === null);
                assert.equal(item instanceof Scene, true);

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