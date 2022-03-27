const { describe, it } = require("mocha");
const assert = require("assert");
const sanitize = require("../../helper/sanitize");

describe("helper/sanitize", () => {


    describe("- encode character", () => {
        sanitize.RULES.forEach(({ char, value }) => {

            it(`Replace "${char}" with "${value}"`, () => {
                assert(sanitize.encode(char) === value);
            });

        });
    });

    describe("- decode character", () => {
        sanitize.RULES.forEach(({ char, value }) => {

            it(`Replace "${value}" with "${char}"`, () => {
                assert(sanitize.decode(value) === char);
            });

        });
    });


    describe("- test custom rules", () => {

        sanitize.RULES.push({
            char: "ä",
            value: "ae"
        }, {
            char: "ö",
            value: "oe"
        }, {
            char: "ü",
            value: "ue"
        });

        sanitize.RULES.slice(-3).forEach(({ char, value }) => {

            it(`Replace "${char}" with "${value}"`, () => {
                assert(sanitize.encode(char) === value);
            });

            it(`Replace "${value}" with "${char}"`, () => {
                assert(sanitize.decode(value) === char);
            });

        });

    });

});