const assert = require("assert");
const { describe, it, beforeEach } = require("mocha");

const infinity = require("../../helper/infinity");

describe("helper/infinity", () => {

    let start = null;
    let restart = false;
    let counter = 0;

    beforeEach(() => {
        start = Date.now();
        restart = false;
        counter = 0;
    });


    it(`Is called immeaditly (>= 1ms)`, () => {
        infinity(() => {
            assert(Date.now() - start <= 1);
        });
    });


    it(`Should fire after 100ms`, (done) => {
        infinity((redo) => {
            if (restart) {

                assert(Date.now() - start >= 1);
                done();

            } else {

                restart = true;
                redo();

            }
        }, 100);
    });


    it("Should call yourself 100x times", (done) => {
        infinity((redo) => {

            if (counter <= 100) {

                counter += 1;
                redo();

            } else {

                assert(counter >= 100);
                assert(Date.now() - start >= 100);

                done();

            }

        }, 1);
    });

});