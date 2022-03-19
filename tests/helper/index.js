const { describe } = require("mocha");

describe("Helper functions", function () {

    this.slow(120);

    require("./test.debounce.js");
    require("./test.extend.js");
    //require("./test.filter.js");          // todo or remove?! see #19
    require("./test.infinity.js");
    require("./test.iterate.js");
    require("./test.mixins.js");
    require("./test.observe.js");
    require("./test.promisify.js");
    require("./test.queue.js");
    require("./test.sanitize.js");
    require("./test.timeout.js");

});