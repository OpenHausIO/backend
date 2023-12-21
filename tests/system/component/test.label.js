const { describe, it } = require("mocha");
const assert = require("assert");

const Label = require("../../../system/component/class.label.js");

describe("label", function () {

    let instance = new Label("hello=world");

    it("should have a key property", () => {
        assert(instance.key);
    });

    it("should have a value property", () => {
        assert(instance.key);
    });

    it("should have a label property", () => {
        assert(instance.label);
    });

    it(".key = hello", () => {
        assert.equal(instance.key, "hello");
    });

    it(".value = world", () => {
        assert.equal(instance.value, "world");
    });

    ["toJSON", "toString"].forEach((fnc) => {

        it(`should have method "${fnc}"`, () => {
            assert(instance[fnc] instanceof Function);
        });

    });


});