const assert = require("assert");
const { describe, it } = require("mocha");

const promisify = require("../../helper/promisify");

describe("helper/promisify", () => {

    describe("- mode: promise", () => {

        it("Should return a promise if no callback is passed", () => {

            let rtrn = promisify((done) => {
                done(null, "foo");
            });

            assert(rtrn instanceof Promise);

            rtrn.then((value) => {
                assert(value === "foo");
            });

        });

        it("Should reject if error is passed", (done) => {

            let rtrn = promisify((done) => {
                done(new Error("rejected"), "foo");
            });

            try {

                assert(rtrn instanceof Promise);

            } catch (err) {
                done(err);
            }

            rtrn.then(() => {

                done(new Error("promise resolve, it should be rejected!"));

            }).catch((err) => {
                try {

                    assert(err instanceof Error);
                    assert(err.message === "rejected");

                    done();

                } catch (assrt) {
                    done(assrt);
                }
            });

        });

    });

    describe("- mode: callback", () => {

        it("Should return undefine if callback passed", () => {

            let rtrn = promisify((done) => {
                done(null, "foo");
            }, () => { });

            assert(!rtrn);

        });

        it("Should execute async if cb is passed", (done) => {

            let rtrn = promisify((cb) => {
                cb(null);
            }, done);

            assert(rtrn === undefined);
            assert(rtrn !== Promise);

        });

        it("First argumetn is foo", (done) => {

            promisify((cb) => {
                cb(null, "foo");
            }, (err, foo) => {

                assert(err === null);
                assert(foo === "foo");

                done();

            });

        });

    });

});