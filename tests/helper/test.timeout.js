const assert = require("assert");
const timeout = require("../../helper/timeout");

describe("helper/timeout", () => {


    it(`Should fire after 100ms`, (done) => {
        timeout(100, (timedout) => {

            // timedout after 100ms
            assert.equal(timedout, true);

            done();

        });
    });

    it(`Should fire immediatly`, (done) => {
        timeout(100, done)();
    });

});