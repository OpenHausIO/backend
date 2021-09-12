const { describe, it } = require("mocha");

const debounce = require("../../helper/debounce");

describe("helper/debounce", () => {


    it(`Should debounce a function, 100ms`, (done) => {

        let fnc = debounce(() => {
            done();
        }, 100);

        for (let i = 0; 10 >= i; i++) {
            fnc();
        }

    });

});