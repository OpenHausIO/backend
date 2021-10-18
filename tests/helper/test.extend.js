const assert = require("assert");
const { describe, it } = require("mocha");

const extend = require("../../helper/extend");

describe("helper/extend", () => {

    it(`Merge two objects`, (done) => {

        let target = {
            prop1: true
        };

        let source = {
            prop2: true
        };

        extend(target, source);

        assert.deepEqual(target, {
            prop1: true,
            prop2: true
        });

        done();

    });


    it(`Deep merge two objects, with nested properties`, (done) => {

        let target = {
            prop1: true,
            obj: {
                prop2: false
            }
        };

        let source = {
            obj: {
                prop3: 5000
            }
        };

        extend(target, source);

        assert.deepEqual(target, {
            prop1: true,
            obj: {
                prop2: false,
                prop3: 5000
            }
        });

        done();

    });

    it(`Deep merge two objects, override with arrays`, (done) => {

        let target = {
            prop1: true,
            obj: {
                prop2: false
            },
            arr: [0, 1, 2]
        };

        let source1 = {
            obj: {
                prop3: 5000
            },
            arr: [3, 4, 5],
            nested: {
                string: "Hello World"
            }
        };

        let source2 = {
            obj: {
                prop4: false,
                prop5: null,
                prop6: "string"
            },
            arr: [6, 7, 8],
            nested: {
                more: {
                    final: {
                        data: Buffer.from("Looks nice here")
                    }
                }
            }
        };

        extend(target, source1, source2);

        assert.deepEqual(target, {
            prop1: true,
            obj: {
                prop2: false,
                prop3: 5000,
                prop4: false,
                prop5: null,
                prop6: "string"
            },
            arr: [6, 7, 8],
            nested: {
                string: "Hello World",
                more: {
                    final: {
                        data: Buffer.from("Looks nice here")
                    }
                }
            }
        });

        done();

    });

});