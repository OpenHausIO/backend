const { describe, it } = require("mocha");
const assert = require("assert");

const { BASE } = require("../../../system/component");

const event = require("events").EventEmitter;
const Hooks = require("../../../system/hooks.js");

describe("base", function () {

    let instance = new BASE();

    describe("- should have following properties", () => {

        it("should have property .events", () => {
            assert(instance.events instanceof event);
        });

        it("should have property .hooks", () => {
            assert(instance.hooks instanceof Hooks);
        });

        it("should have property .ready", () => {
            assert(typeof (instance.ready) === "boolean");
        });

    });


    describe("- should have following methods", () => {

        it("should have method init", () => {
            assert(instance.init instanceof Function);
        });

    });

});