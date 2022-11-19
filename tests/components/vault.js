const assert = require("assert");
const mongodb = require("mongodb");

try {

    const C_COMPONENT = require(`../../components/vault/index.js`);
    const Vault = require("../../components/vault/class.vault.js");

    const workflow = require("./test.workflow.js");

    let _id = String(new mongodb.ObjectId());


    workflow(C_COMPONENT, "add", (done) => {
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

                assert.ok(err === null);
                assert.equal(item instanceof Vault, true);

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
            }, {
                name: "Password",
                key: "PASSWORD",
                value: "12345678"
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


    workflow(C_COMPONENT, "remove", (done) => {
        C_COMPONENT.remove(_id, (err, item) => {
            try {

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