const { describe, it } = require("mocha");
const Hooks = require("../../system/hooks");

describe("system/hooks", function () {


    it(`use(); should always pass as last argument a "next" function`, function (done) {

        let hooks = new Hooks();

        hooks.pre("test", (next) => {
            next();
        });

        hooks.post("test", (next) => {
            next();
        });

        hooks.trigger("test", (next) => {

            // this gets called when pre hooks are done
            // then call "next" to trigger post hooks

            next(() => {

                // this is called when post hooks are done
                done();

            });


        });

    });

});