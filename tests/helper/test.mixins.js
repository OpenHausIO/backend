const assert = require("assert");
const { describe, it, beforeEach } = require("mocha");

const mixins = require("../../helper/mixins");


describe("helper/mixins", () => {

    describe("- transparent mode: false", () => {

        let target = {};
        let proto = function proto() { };


        beforeEach(() => {
            target = {};
        });


        let options = {
            setPrototype: false,
            transparent: false
        };

        it(`Check if properties are assigned, options: ${JSON.stringify(options)}`, () => {

            let result = mixins([target, {
                prop: true,
                arr: [0, 1, 2]
            }], options);

            assert.deepEqual(result, {
                prop: true,
                arr: [0, 1, 2]
            });

        });


        it("Check for target protoype", () => {

            let result = mixins([proto, target], {
                ...options,
                setPrototype: true
            });

            assert(Object.getPrototypeOf(result) === proto);

        });


    });


    describe("- transparent mode: true", () => {

        let target = {};

        beforeEach(() => {
            target = {};
        });


        it(`check for propertie "hidden" = true`, () => {

            let result = mixins([target, {
                hidden: true,
            }]);

            assert(result.hidden === true);

        });


        it(`check if target object .hasOwnProperty() "hidden" = false`, () => {

            let result = mixins([target, {
                hidden: true,
            }]);

            assert(Object.prototype.hasOwnProperty.call(result, "hidden") === false);

        });


        /*
        it("Checks if returnd thing is a proxy instance", () => {

            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/hasInstance
            // check if returnd thig is proxy, utilizy Symbol.hasInstance?!

            //assert(result instanceof Proxy);

        });
        */


    });


});