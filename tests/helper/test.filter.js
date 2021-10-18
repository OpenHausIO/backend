const { describe, it, beforeEach } = require("mocha");

const filter = require("../../helper/filter");

describe("helper/filter", () => {

    let data = [];


    beforeEach(() => {

        data = [{
            manufacturer: "pioneer",
            model: "SC-LX501"
        }, {
            manufacturer: "samsung",
            modle: ""
        }, {
            manufacturer: "siemens",
            model: "s700"
        }];

    });


    it(`Should debounce a function, 100ms`, (done) => {

        let filted = data.filter((obj) => {
            return filter(obj, (data) => {

                return data.manufacturer === "pioneer";

            });
        });

        console.log(filted);

        done();

    });

});