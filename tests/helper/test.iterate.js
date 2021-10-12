const { describe, it, beforeEach } = require("mocha");
const assert = require("assert");
const iterate = require("../../helper/iterate");

describe("helper/iterate", () => {

    let data = {};

    beforeEach((done) => {

        data = {
            boolean: true,
            timestamp: Date.now(),
            obj: {
                nested: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
                number: Math.random() * (100000 - 999999) + 999999,
                more: {
                    data: [null, undefined, true, false],
                    buffer: Buffer.from("Hello World")
                }
            },
            encoded: (new TextEncoder()).encode("€ - ÄÖÜ - äöü ¼ $ `"),
            random: Math.random() < 0.5
        };

        done();

    });


    it(`"value" should be equal to "parent.key"`, (done) => {


        iterate(data, (key, value, type, parent) => {

            assert.equal(value, parent[key]);

            return value;

        });

        done();

    });


    it(`iterrations should be 38 (every item/property inside the object)`, (done) => {

        let counter = 0;


        iterate(data, (key, value) => {

            counter += 1;

            return value;

        });

        assert.equal(counter, 38);

        done();

    });


});