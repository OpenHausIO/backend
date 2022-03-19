const assert = require("assert");
const { describe, it } = require("mocha");

const queue = require("../../helper/queue");

describe("helper/queue", () => {


    it("Wait that caller is called 10x times before callback is called", (done) => {

        let countdown = 10;

        let caller = queue(countdown, () => {

            assert(countdown === 0);

            done();

        });

        while (countdown >= 0) {
            countdown -= 1;
            caller();
        }

    });


    it("Callback arguments is passed", (done) => {

        let symbol = Symbol("bar");

        let caller = queue(1, (arg1, arg2, arg3) => {

            assert(arg1 === null);      // "error"
            assert(arg2 === "foo");
            assert(arg3 === symbol);

            done();

        });

        process.nextTick(() => {
            caller(null, "foo", symbol);
        });

    });


});