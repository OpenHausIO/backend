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


    it(`Should filter for manufacturer "pioneer"`, (done) => {

        let filted = filter(data, (obj) => {
            return obj.manufacturer === "pioneer";
        });

        console.log(filted);

        done();

    });

});