const BASE = require("./class.base.js");
const COMMON = require("./class.common.js");
const COMPONENT = require("./class.component.js");

/**
 * @description
 * This describes the component staff in the system folder.<br />
 * Every component depends on this classes and inherits all properties/methods.
 * 
 * The `index.js` file is just a short cut to the class files:
 * 
 * @example
 * ```js
const BASE = require("./class.base.js");
const COMMON = require("./class.common.js");
const COMPONENT = require("./class.component.js");

module.exports = {
    BASE,
    COMMON,
    COMPONENT
};
 * ```
 */
module.exports = {
    BASE,
    COMMON,
    COMPONENT
};