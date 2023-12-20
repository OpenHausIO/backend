const assert = require("assert");
const { it } = require("mocha");
const sinon = require("sinon");

const _iterate = require("../../helper/iterate.js");

const Item = require("../../system/component/class.item.js");

module.exports = (C_COMPONENT, method, desc, worker) => {

    if (!worker && desc instanceof Function) {
        worker = desc;
        desc = null;
    }

    let pre = sinon.spy();
    let post = sinon.spy();
    let event = sinon.spy();

    C_COMPONENT.hooks.pre(method, (...args) => {
        pre(...args);
        args[args.length - 1](null);
    });

    C_COMPONENT.hooks.post(method, (...args) => {
        post(...args);
        args[args.length - 1](null);
    });

    C_COMPONENT.events.on(method, (...args) => {
        //console.log("Event", method, args);
        event(...args);
    });

    it(`Should perform method "${method}" ${desc ? "(" + desc + ")" : ""}`, (done) => {
        worker(done, {
            pre,
            post,
            event
        });
    });

    it(`Should fired event "${method}" at least once ${desc ? "(" + desc + ")" : ""}`, (done) => {
        //assert.equal(event.calledOnce, true);
        assert.ok(event.callCount >= 1);
        done();
    });

    if (method === "add") {

        it(`Items array should have 1 item ${desc ? "(" + desc + ")" : ""}`, (done) => {
            assert.equal(C_COMPONENT.items.length, 1);
            done();
        });

        it("Component item should be instance of item class", (done) => {
            assert.ok(C_COMPONENT.items[0] instanceof Item);
            done();
        });

        it("Component item _id property should be a string, not a ObjectId instance", (done) => {
            assert.ok(typeof (C_COMPONENT.items[0]._id) === "string");
            done();
        });

        it(`Every array in item should have a _id property ${desc ? "(" + desc + ")" : ""}`, (done) => {
            try {

                _iterate(C_COMPONENT.items[0], (key, value, type) => {

                    if (type === "array") {

                        let result = value.every((entry) => {
                            if (entry instanceof Object) {
                                return Object.hasOwnProperty.call(entry, "_id");
                            } else {
                                return true;
                            }
                        });

                        assert.ok(result === true);

                    }

                    return value;

                });

                done(null);

            } catch (err) {

                done(err);

            }
        });

    }

    it(`Should fire pre hook "${method}" ${desc ? "(" + desc + ")" : ""}`, (done) => {
        try {

            // NOTE:
            // middleware hooks can be fired more than once
            // e.g. the vault test triggers 2 iterations
            // due to the reactivity of secret which trigger a other component `.update` call

            //assert.equal(pre.calledOnce, true);
            //assert.equal(post.callCount, 1);
            assert.ok(post.callCount > 0);

            done();

        } catch (err) {
            done(err);
        }
    });

    it(`Should fire post hook "${method}" ${desc ? "(" + desc + ")" : ""}`, (done) => {
        try {

            if (method === "remove") {

                let objid = new RegExp(/^[0-9a-fA-F]{24}$/);

                post.args.forEach((args) => {

                    // check mongodb result object
                    assert.equal(Object.hasOwnProperty.call(args[1], "acknowledged"), true);
                    assert.equal(Object.hasOwnProperty.call(args[1], "deletedCount"), true);

                    // check object id
                    assert.equal(objid.test(args[2]), true);

                    // check next function
                    assert.equal(args[3] instanceof Function, true);

                });

            }

            // NOTE:
            // middleware hooks can be fired more than once
            // e.g. the vault test triggers 2 iterations
            // due to the reactivity of secret which trigger a other component `.update` call

            //assert.equal(post.calledOnce, true);
            //assert.equal(post.callCount, 1);
            assert.ok(post.callCount > 0);
            assert.equal(post.calledAfter(pre), true);

            done();

        } catch (err) {
            done(err);
        }
    });

};