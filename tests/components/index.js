const { describe, it } = require("mocha");

describe("Components", () => {

    describe("General", () => {

        [
            "devices", "endpoints", "plugins",
            "rooms", "ssdp", "store", "users",
            "vault"
        ].forEach((name) => {
            describe(name, () => {


                it(`should emit the "ready" event when init is done`, (done) => {

                    delete require.cache[require.resolve(`../../components/${name}`)];
                    let C_COMPONENT = require(`../../components/${name}`);

                    C_COMPONENT.events.once("ready", () => {
                        done();
                    });

                });


                it(`should call the ._ready callback when init is done`, (done) => {

                    delete require.cache[require.resolve(`../../components/${name}`)];
                    let C_COMPONENT = require(`../../components/${name}`);

                    C_COMPONENT._ready(() => {
                        done();
                    });

                });


                describe(`Trigger pre hooks`, () => {

                    delete require.cache[require.resolve(`../../components/${name}`)];
                    let C_COMPONENT = require(`../../components/${name}`);

                    ["add", "get", "remove", "update", "find"].forEach((method) => {
                        it(`Method: ${method}`, (done) => {

                            C_COMPONENT.hooks.pre(method, () => {
                                done();
                            });

                            C_COMPONENT[method]({});

                        });
                    });

                });


                /*
                // TODO: Implement
                describe(`Trigger post hooks`, () => {

                    delete require.cache[require.resolve(`../../components/${name}`)];
                    let C_COMPONENT = require(`../../components/${name}`);

                    ["add", "get", "remove", "update", "find"].forEach((method) => {
                        it(`Method: ${method}`, (done) => {

                            C_COMPONENT.hooks.pre(method, () => {
                                done()
                            });

                            C_COMPONENT[method]({});

                        });
                    });

                });
                */

            });
        });

    });


    //require("./test.middleware.js");
    //require("./component/index.js");

});