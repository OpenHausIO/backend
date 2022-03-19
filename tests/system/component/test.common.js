const { describe, it } = require("mocha");
const assert = require("assert");

const { COMMON } = require("../../../system/component");



describe("common", function () {

    let logger = Symbol("logger");
    let instance = new COMMON(logger);

    describe("- should have following properties", () => {

        it("should have property .logger", () => {
            assert(instance.logger === logger);
        });

    });

    describe("- should have following methods", () => {

        it("should have method _defineMethod", () => {
            assert(instance._defineMethod instanceof Function);
        });

    });

});