const Middleware = require("../system/middleware");
const assert = require("assert").strict;

describe("system/middleware", () => {

    it(`has a "use" function`, () => {
        let middleware = new Middleware();
        assert.equal(typeof middleware.use, "function", `"use" is not a function`)
    });

    it(`has a "start" function`, () => {
        let middleware = new Middleware();
        assert.equal(typeof middleware.start, "function", `"start" is not a function`)
    });

    it(`has a "catch" function`, () => {
        let middleware = new Middleware();
        assert.equal(typeof middleware.catch, "function", `"use" is not a function`)
    });

    describe(`use(); function`, () => {

        it(`should throw a error if "next" first/error argument is anything other than Error/undefined/null`, function (done) {

            let middleware = new Middleware();

            middleware.use((next) => {
                try {

                    next({});

                } catch (err) {

                    assert.strictEqual(err instanceof Error, true, "Thrown error is not a error");

                    done();

                }
            });

            middleware.start(done);


        });


        it(`basic flow`, function (done) {


            let middleware = new Middleware();

            middleware.use((next) => {
                next();
            });

            middleware.use((next) => {
                next(null);
            });

            middleware.start((...args) => {
                done();
            });

        });


        it(`use(); should always pass as last argument a "next" function`, function (done) {

            let middleware = new Middleware();

            middleware.use((...args) => {
                assert.strictEqual(args[args.length - 1] instanceof Function, true, `Last argument is not a "next" function`);
                done();
            });

            middleware.start(() => { });

        });


        it(`use(); should pass arguments`, function (done) {

            let obj1 = { timestamp: Date.now() };
            let obj2 = { number: 420 };

            let middleware = new Middleware();

            middleware.use((arg1, arg2, next) => {
                assert.strictEqual(arg1, obj1, `Argument 1 = Object 1`);
                assert.strictEqual(arg2, obj2, `Argument 2 = Object 2`);
                next();
            });

            middleware.start(obj1, obj2, () => {
                done();
            });

        });


        it("use(); modifie passed arguments", function (done) {


            let middleware = new Middleware();

            middleware.use((A, B, C, next) => {

                assert.strictEqual(A, "A", `A != "A"`);
                assert.strictEqual(B, "B", `B != "B"`);
                assert.strictEqual(C, "C", `C != "C"`);

                next(null, A, "Z", C);

            });

            middleware.use((A, B, C, next) => {

                assert.strictEqual(A, "A", `A != "A"`);
                assert.strictEqual(B, "Z", `B != "Z"`);
                assert.strictEqual(C, "C", `C != "C"`);

                next();

            });

            middleware.start("A", "B", "C", (A, B, C) => {

                assert.strictEqual(A, "A", `A = "A"`);
                assert.strictEqual(B, "Z", `B = "Z"`);
                assert.strictEqual(C, "C", `C = "C"`);

                done();

            });

        });


        it(`use(); do not modifie un-passed arguments to "next()"`, function (done) {


            let middleware = new Middleware();
            let obj1 = {};
            let obj2 = {};
            let obj3 = { original: true };

            middleware.use((obj1, obj2, obj3, next) => {

                obj1.modified = true;
                obj2.modified = true;

                next();

            });

            middleware.use((obj1, obj2, obj3, next) => {
                next(null, obj1, { custom: true, ...obj2 });
            });

            middleware.start(obj1, obj2, obj3, (m_obj1, m_obj2, m_obj3) => {

                // no fucking clue how to test

                assert.deepStrictEqual(obj1, m_obj1, "obj1 == obj1")
                // should fail! who to check that?
                // obj2 != m_obj2 = ok
                //assert.deepStrictEqual(obj2, m_obj2, "obj2 == obj2") 
                assert.deepStrictEqual(obj3, m_obj3, "obj3 == obj3")


                done();

            });

        });

    });

    describe(`start(); function`, () => {

        it(`start(); should execute callback`, (done) => {
            let middleware = new Middleware();
            middleware.start(done);
        });

        it(`should pass arguments to callback`, (done) => {

            let middleware = new Middleware();
            middleware.start("A", "B", "C", (...args) => {
                assert.equal(args.length, 3, "To few Arguments");
                done();
            });

        })

    });

    describe("catch(); function", () => {

        it(`catch(); passed error to "next()"`, (done) => {

            let middleware = new Middleware();

            middleware.use((next) => {
                next(new Error("Test"));
            });

            middleware.catch((err) => {
                assert.ok(err, `No "err" argument received`);
                assert.strictEqual(err instanceof Error, true, `"err" argument is not a Error instance`);
                done();
            });

            middleware.start();

        });

    });

});
