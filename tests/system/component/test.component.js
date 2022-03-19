const { describe, it } = require("mocha");
const assert = require("assert");
const joi = require("joi");
const mongodb = require("mongodb");

const { COMPONENT } = require("../../../system/component");

// https://flaviocopes.com/how-to-list-object-methods-javascript/
const getItmes = (obj) => {

    let properties = new Set();
    let currentObj = obj;

    do {
        Object.getOwnPropertyNames(currentObj).forEach((item) => {
            properties.add(item);
        });
    } while ((currentObj = Object.getPrototypeOf(currentObj)));

    //return [...properties.keys()].filter(item => typeof obj[item] === 'function')
    return properties.keys();

};


describe("component", function () {

    let instance = new COMPONENT("test", {});

    describe("- should have following properties", () => {

        it("should have property .items", () => {
            assert(instance.items instanceof Array);
        });

        it("should have property .collection", () => {
            assert.deepEqual(instance.collection, mongodb.client.collection("test"));
        });

        it("should have property .schema", () => {
            assert(joi.isSchema(instance.schema), "schema is joi schema");
        });

    });

    describe("- should have following methods", () => {

        ["get", "add", "update", "remove", "find"].forEach((name) => {
            it(`should have method "${name}"`, () => {
                assert(instance[name] instanceof Function);
            });
        });

    });

    // TODO check for "unwanted" proerties/methods
    // To a prototype lookup for all items/methods
    // E.g. instance should only have: get(), add(), update(), remove(), find(), items, collectin, schema
    // E.g. for prototype lookup (component inerhits from common): logger, _defineMethod()
    // E.g. Native methods/properties, like for objects: hasOWnPropertie(), keys()
    //console.log(Object.getOwnPropertyNames(instance)) // returns properties & first level methods, but not "BASE" methods like .init()
    //console.log(Object.getOwnPropertyNames(instance))
    //console.log(getMethods(instance));
    // NOTE following code, good solution?!
    describe("- should *not* have other items than the following  (excluding native object properties)", () => {

        // items/properties to ignore
        let ignore = Array.from(getItmes(Object));

        // the following items are part of the component prototype chain
        let properties = [
            "events", "hooks", "ready",                 // base properties
            "init",                                     // base methods
            "logger",                                   // common properties
            "_defineMethod",                            // common methods
            "items", "collection", "schema",            // common properties
            "get", "add", "update", "remove", "find"    // component methods
        ];

        for (let item of getItmes(instance)) {
            if (!ignore.includes(item)) {

                it(`have allowed item/propertie/method: ${item}`, () => {
                    assert(properties.includes(item), `Not allowed item "${item}" found`);
                });

            }
        }

    });


});