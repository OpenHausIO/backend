const assert = require("assert");
const { describe, it } = require("mocha");

const injectMethod = require("../../helper/injectMethod");

class Item{

    constructor(){
        this.boolean = true;
    }

    ping(){
        return this;
    }

}

describe("helper/injectMethod", () => {

    it(`Define method on class protoype`, (done) => {

        let item = new Item();

        injectMethod(item, "pong", function pong(){
            return this;
        });

        let proto = Object.getPrototypeOf(item);
        let props = Object.getOwnPropertyNames(proto);

        assert.ok(props.includes("ping"));
        assert.ok(props.includes("pong"));

        done();

    });


    it(`Compare prototype descriptors of methods ping/pong`, (done) => {

        let item = new Item();

        injectMethod(item, "pong", function(){
            return this;
        });

        let proto = Object.getPrototypeOf(item);
        let ping = Object.getOwnPropertyDescriptor(proto, "ping");
        let pong = Object.getOwnPropertyDescriptor(proto, "pong");

        // remove function (want only the descriptors);
        delete ping.value;
        delete pong.value;

        assert.deepEqual(ping, pong);

        done();

    });


    it(`Check if "this" scope is set correctly for method`, (done) => {

        let item = new Item();

        injectMethod(item, "pong", function(){
            return this;
        });

        assert.deepEqual(item.ping(), item.pong());
        assert.ok(item.ping() === item.pong());

        done();

    });

});