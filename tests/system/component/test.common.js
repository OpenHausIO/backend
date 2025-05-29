const { describe, it } = require("mocha");
const assert = require("assert");
//const sinon = require("sinon");

const Logger = require("../../../system/logger/class.logger.js");
const { COMMON } = require("../../../system/component");

var parallel = require("mocha.parallel");



describe("common", () => {

    let logger = new Logger();
    let instance = new COMMON(logger);

    /*
    instance._defineMethod("foo", () => {
        return (...args) => {
            return new Promise((resolve, reject) => {
                resolve(args);
            });
        };
    });

    instance._defineMethod("bar", () => {
        return (...args) => {
            return new Promise((resolve, reject) => {
                resolve(args);
            });
        };
    });

    describe("- should have following properties", () => {

        it("should have property .logger", () => {
            assert(instance.logger === logger);
        });

        it(".logger is a instance of Logger (class.logger.js)", () => {
            assert(instance.logger instanceof Logger);
        });

        it("should have fake methods foo & bar", () => {
            assert(instance.foo instanceof Function);
            assert(instance.bar instanceof Function);
        });

    });

    describe("- Trigger pre/post hooks when method is called", () => {

        const m1 = sinon.spy()
        const m2 = sinon.spy()

        ["pre", "post"].forEach((hook) => {

            it(`should trigger ${hook} hook`, (done) => {
                instance.hooks[hook]("foo", (...args) => {

                    assert(args[args.length - 1] instanceof Function);
                    //assert(typeof (args[0]) === "number");
                    //assert(typeof (args[1]) === "boolean");
                    //assert(args[2] instanceof Object);

                    done();

                    // next function
                    args[args.length - 1](null);

                });
            });

            it(`Argument 0 is number`, (done) => {
                instance.hooks[hook]("foo", (...args) => {

                    assert(typeof (args[0]) === "number");

                    done();

                    // next function
                    args[args.length - 1](null);

                });
            });

            it(`Argument 1 is boolean`, (done) => {
                instance.hooks[hook]("foo", (...args) => {

                    assert(typeof (args[1]) === "boolean");

                    done();

                    // next function
                    args[args.length - 1](null);

                });
            });

            it(`Argument 2 is object`, (done) => {
                instance.hooks[hook]("foo", (...args) => {

                    assert(args[2] instanceof Object);

                    done();

                    // next function
                    args[args.length - 1](null);

                });
            });

        });

        it(`should process a request through middleware`, (done) => {
            instance.foo(Date.now(), true, {
                data: false,
                ts: Date.now()
            }, (err, ...args) => {

                // middleware done
                expect(m1.calledOnce, `m1`).to.equal(true);
                expect(m2.calledOnce, `m2`).to.equal(true);

                done();

                //assert(err === null);
                //assert(typeof (args[0]) === "number");
                //assert(typeof (args[1]) === "boolean");
                //assert(args[2] instanceof Object);
                //done();

            });
        });

    });

    */



    describe("- should have following properties", () => {

        it("should have property .logger", () => {
            assert(instance.logger instanceof Logger);
        });

    });

    describe("- should have following methods:", () => {

        instance._defineMethod("foo", () => {
            return (...args) => {
                return new Promise((resolve) => {
                    resolve(args);
                });
            };
        });

        instance._defineMethod("bar", () => {
            return (...args) => {
                return new Promise((resolve) => {
                    resolve(args);
                });
            };
        });

        it("should have method _defineMethod", () => {
            assert(instance._defineMethod instanceof Function);
        });

        it("should have method fake methods foo & bar", () => {
            assert(instance.foo instanceof Function);
            assert(instance.bar instanceof Function);
        });

    });

    //describe("- Test pre/post hooks", () => {

    //parallel("Argument assertion:", () => {
    parallel("- Test pre/post hooks", () => {

        ["pre", "post"].forEach((hook) => {

            it(`should trigger ${hook} hook`, (done) => {
                instance.hooks[hook]("foo", (...args) => {

                    assert(args[args.length - 1] instanceof Function);
                    //assert(typeof (args[0]) === "number");
                    //assert(typeof (args[1]) === "boolean");
                    //assert(args[2] instanceof Object);

                    done();

                    // next function
                    args[args.length - 1](null);

                });
            });

            it(`Argument 0 is number`, (done) => {
                instance.hooks[hook]("foo", (...args) => {

                    assert(typeof (args[0]) === "number");

                    done();

                    // next function
                    args[args.length - 1](null);

                });
            });

            it(`Argument 1 is boolean`, (done) => {
                instance.hooks[hook]("foo", (...args) => {

                    assert(typeof (args[1]) === "boolean");

                    done();

                    // next function
                    args[args.length - 1](null);

                });
            });

            it(`Argument 2 is object`, (done) => {
                instance.hooks[hook]("foo", (...args) => {

                    assert(args[2] instanceof Object);

                    done();

                    // next function
                    args[args.length - 1](null);

                });
            });

        });

        it("Should call the method callback after middleware hooks", (done) => {
            //setTimeout(() => {

            instance.foo(Date.now(), true, {
                data: false,
                ts: Date.now()
            }, (err, ...args) => {

                assert(err === null);
                assert(typeof (args[0]) === "number");
                assert(typeof (args[1]) === "boolean");
                assert(args[2] instanceof Object);

                done();

            });

            //}, 1000);
        });

    });

    //describe("Error handling", () => {

    it("Should abort execution stack when error is passed to .next function", (done) => {

        let counter = 0;

        instance.hooks.pre("bar", (next) => {
            counter++;
            next(new Error("Aborted"));
        });

        instance.hooks.pre("bar", (next) => {
            counter++;
            next();
        });

        instance.hooks.post("bar", (next) => {
            counter++;
            done();
            next();
        });

        instance.hooks.post("bar", (next) => {
            counter++;
            done();
            next();
        });

        instance.bar((err) => {

            assert(err instanceof Error);
            assert(counter === 1);

            done();

        });

    });

    //});

    //});


});
