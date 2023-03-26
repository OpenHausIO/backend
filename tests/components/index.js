const { describe, it } = require("mocha");

describe("Components", () => {

    describe("General", () => {

        [
            "devices", "endpoints", "plugins",
            "rooms", "ssdp", "store", "users",
            "vault", "webhooks", "mdns", "mqtt",
            "scenes"
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

                // component specific tests
                require(`./${name}.js`);

            });
        });

    });


    //require("./test.middleware.js");
    //require("./component/index.js");

});