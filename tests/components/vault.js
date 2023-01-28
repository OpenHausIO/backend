const assert = require("assert");
const mongodb = require("mongodb");
//const { it } = require("mocha");

try {

    const C_COMPONENT = require(`../../components/vault/index.js`);
    const Vault = require("../../components/vault/class.vault.js");

    const workflow = require("./test.workflow.js");

    let _id = String(new mongodb.ObjectId());


    workflow(C_COMPONENT, "add", (done, { event }) => {
        C_COMPONENT.add({
            _id,
            name: "Test credentials",
            identifier: "TEST",
            secrets: [{
                name: "Username",
                key: "USERNAME",
                value: "marc.stirner@example.com"
            }, {
                name: "Password",
                key: "PASSWORD",
                value: "Pa$$w0rd"
            }]
        }, (err, item) => {
            try {

                // check event arguments
                event.args.forEach((args) => {
                    assert.equal(args[0] instanceof Vault, true);
                });

                assert.ok(err === null);
                assert.equal(item instanceof Vault, true);

                done(err);

            } catch (err) {

                done(err);

            }
        });
    });

    /*
    it("Should decrypt secrets", (done) => {
        try {

            let item = C_COMPONENT.items[0];

            item.secrets.forEach((secret) => {
                return secret.decrypt();
            });

            done();

        } catch (err) {
            done(err);
        }
    });
    */

    workflow(C_COMPONENT, "get", (done) => {
        C_COMPONENT.get(_id, (err, item) => {
            try {

                assert.ok(err === null);
                assert.equal(item instanceof Vault, true);

                done(err);

            } catch (err) {

                done(err);

            }
        });
    });


    workflow(C_COMPONENT, "update", (done) => {
        C_COMPONENT.update(_id, {
            secrets: [{
                name: "Username",
                key: "USERNAME",
                value: "marc.stirner@example.com"
            }]
        }, (err, item) => {
            try {

                assert.ok(err === null);
                assert.equal(item instanceof Vault, true);
                //assert.equal(item.secrets[1].name, "Password");

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
                secrets: [{
                    name: "Username",
                    key: "USERNAME",
                    value: "marc.stirner@example.com"
                }, {
                    name: "Password",
                    key: "PASSWORD",
                    value: "12345678"
                }]
            }),

            // update call 2
            C_COMPONENT.update(_id, {
                secrets: [{
                    name: "Username",
                    key: "USERNAME",
                    value: "john.doe@example.com"
                }, {
                    name: "Password",
                    key: "PASSWORD",
                    value: "87654321"
                }]
            })

        ]).then(() => {

            event.args.forEach((args) => {
                assert.equal(args[0] instanceof Vault, true);
                assert.ok(args[0].secrets.length === 2);
            });

            done();

        }).catch(done);
    });


    workflow(C_COMPONENT, "remove", (done, { post }) => {
        C_COMPONENT.remove(_id, (err, item) => {
            try {

                // check post arguments item instance
                post.args.forEach((args) => {
                    assert.equal(args[0] instanceof Vault, true);
                });

                assert.ok(err === null);
                assert.equal(item instanceof Vault, true);

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