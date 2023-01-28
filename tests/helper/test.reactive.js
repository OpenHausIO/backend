const assert = require("assert");
const { describe, it } = require("mocha");
const sinon = require("sinon");

const reactive = require("../../helper/reactive.js");

try {

    let data = {
        number: Date.now(),
        bool: true,
        symb: Symbol("symbol"),
        arr: ["str", {
            obj: {
                str: "Hello",
                buff: Buffer.from("World")
            }
        }, false],
        buff: Buffer.from("This is a buffer"),
        obj: {
            deep: {
                nested: {
                    seems: {
                        like: {
                            it: {
                                is: {
                                    so: true
                                }
                            }
                        },
                        bool: false,
                        ts: Date.now()
                    }
                }
            },
            str: {
                na: {
                    its: {
                        a: "obj"
                    }
                }
            }
        }
    };

    describe("helper/reactive", () => {

        let getter = sinon.spy();
        let setter = sinon.spy();

        let proxy = reactive(data, getter, setter);

        it(`Calls getter();`, (done) => {
            try {

                assert.equal(proxy.arr[0], "str");
                assert.ok(getter.args.length > 0);

                done();

            } catch (err) {
                done(err);
            }
        });

        it(`Calls setter();`, (done) => {
            try {

                proxy.bool = false;

                assert.ok(setter.args.length > 0);
                assert.equal(proxy.bool, false);

                done();

            } catch (err) {
                done(err);
            }
        });

    });

} catch (err) {

    console.error(err);
    process.exit(1);

}