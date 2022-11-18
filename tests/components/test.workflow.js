const assert = require("assert");
const { it } = require("mocha");
const sinon = require("sinon");

const _iterate = require("../../helper/iterate.js");

module.exports = (C_COMPONENT, method, worker) => {

    let pre = sinon.spy();
    let post = sinon.spy();

    C_COMPONENT.hooks.pre(method, (...args) => {
        pre(...args);
        args[args.length - 1](null);
    });

    C_COMPONENT.hooks.post(method, (...args) => {
        post(...args);
        args[args.length - 1](null);
    });

    it(`Should perform method "${method}"`, (done) => {
        worker(done, {
            pre,
            post
        });
    });

    it(`Every array in item should have a _id property`, (done) => {
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

    it(`Should fire pre hook "${method}"`, (done) => {
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

    it(`Should fire post hook "${method}"`, (done) => {
        try {

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