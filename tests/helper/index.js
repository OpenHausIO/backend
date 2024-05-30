const { describe } = require("mocha");

describe("Helper functions", function () {

    this.slow(120);

    require("./test.debounce.js");
    require("./test.extend.js");
    //require("./test.filter.js");          // todo or remove?! see #19
    require("./test.infinity.js");
    //require("./test.injectMethod.js"); // removed due to problems on `interface.bridge()`, see https://github.com/OpenHausIO/backend/issues/463#issuecomment-2131411981
    require("./test.iterate.js");
    require("./test.mixins.js");
    require("./test.observe.js");
    require("./test.promisify.js");
    require("./test.queue.js");
    require("./test.reactive.js");
    require("./test.request.js");
    require("./test.sanitize.js");
    require("./test.timeout.js");

});