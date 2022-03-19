const { describe } = require("mocha");

describe("System", () => {

    require("./test.hooks.js");
    require("./test.middleware.js");
    require("./component/index.js");

});