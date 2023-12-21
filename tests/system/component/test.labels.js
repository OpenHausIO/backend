const { describe, it } = require("mocha");
const assert = require("assert");

const Labels = require("../../../system/component/class.labels.js");
const Label = require("../../../system/component/class.label.js");

describe("labels", function () {

    let labels = [
        "foo=bar",
        "baz=true",
        "gen=1",
        'json={"key": "value"}',
        "gen=3"
    ].map((txt) => {
        return new Label(txt);
    });

    let instance = new Labels(...labels);

    it("should be a instance of Array", () => {
        assert(instance instanceof Array);
    });

    it("should have 4 items", () => {
        assert.equal(instance.length, 5);
    });

    it("every item should be a instance of class.label.js", () => {

        let valid = instance.every((label) => {
            return label instanceof Label;
        });

        assert(valid);

    });

    [
        "key", "value", "has",
        "filter", "toJSON"
    ].forEach((fnc) => {

        it(`should have method "${fnc}"`, () => {
            assert(instance[fnc] instanceof Function);
        });

    });

    it('labels.key("bar") should return "foo"', () => {
        assert.equal(instance.key("bar"), "foo");
    });

    it('labels.value("baz") should return "foo"', () => {
        assert.equal(instance.value("baz"), "true");
    });

    it('labels.has("gen") should return true', () => {
        assert.equal(instance.has("gen"), true);
    });

    it('labels.filter("gen=*") should return 2 items', () => {
        assert.equal(instance.filter("gen=*").length, 2);
    });

});