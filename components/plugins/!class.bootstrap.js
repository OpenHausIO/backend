const path = require("path");

/**
 * @description
 * Gets passed to the plugin
* 
 * @class Bootstrap
 * 
 * @param {Array} dependencies Array of comopnents direclty inject into the plugin as parameter. E.g.: `["rooms", "devices"]`
 * @param {Function} cb Callback function that receives the `this` scope as first parameter and a array of component instances as second
 */
class Bootstrap {

    constructor(dependencies, cb) {
        if (dependencies instanceof Array && cb instanceof Function) {

            dependencies = dependencies.map((name) => {
                return require(path.resolve(process.cwd(), `components/${name}`));
            });


            Object.defineProperty(this, "_dependencies", {
                value: dependencies,
                writable: false,
                configurable: false
            });

            // callback
            cb(this, dependencies);

        }
    }

    init(done) {
        process.nextTick(done);
    }

}

module.exports = Bootstrap;