const path = require("path");

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