const assert = require("assert");
const { describe, it } = require("mocha");


const observe = require("../../helper/observe");

describe("helper/observe", () => {

    let target = {
        string: "Hello World",
        number: 5,
        boolean: false,
        nothing: null,
        dead: undefined,
        data: Buffer.from("Hello sexy ;)")
    };

    it(`Call getter when access a property`, () => {

        let keys = Object.keys(target);

        let proxied = observe(target, (target, prop) => {
            assert.ok(Object.prototype.hasOwnProperty.call(target, prop));
            assert.ok(keys.includes(prop));
        });

        for (let key in target) {
            assert.deepEqual(proxied[key], target[key]);
        }

    });

    /*
    // DOES NOT WORK
    it(`Call setter when set a property`, () => {

        let proxied = observe(target, {}, null, (prop, value, target, receiver) => {

            console.log(prop, value, target, receiver)

        });

        proxied.number = 10;

    });
    */

});