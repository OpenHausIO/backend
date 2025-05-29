const { describe, it } = require("mocha");
const fs = require("fs");
const path = require("path");

describe("Components", () => {

    describe("General", () => {

        [
            "devices", "endpoints", "plugins",
            "rooms", "ssdp", "store", "users",
            "vault", "webhooks", "mdns", "mqtt",
            "scenes"
        ].forEach((name) => {
            describe(name, () => {

                // clear require cach before each test
                // otherwise the `.scope` property cant be set in component classes
                // because its not configurerable/writable
                beforeEach((done) => {

                    let base = path.join(process.cwd(), `components/${name}/`);

                    fs.readdirSync(base).map((file) => {
                        return path.join(base, file);
                    }).forEach((file) => {
                        delete require.cache[file];
                    });

                    done();

                });


                it(`should emit the "ready" event when init is done`, (done) => {

                    let C_COMPONENT = require(`../../components/${name}`);

                    C_COMPONENT.events.once("ready", () => {
                        done();
                    });

                });


                it(`should call the ._ready callback when init is done`, (done) => {

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