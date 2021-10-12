const { describe } = require("mocha");

describe("Helper functions", () => {

    require("./test.debounce.js");
    require("./test.timeout.js");
    require("./test.iterate.js");
    //require("./test.filter.js");
    //require("./test.extend.js");        // broken
    //require("./test.mixins.js");        // todo
    require("./test.observe.js");

});