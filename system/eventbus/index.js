const RPC = require("./class.rpc.js");
const Topic = require("./class.topic.js");
const Bus = require("./class.bus.js");


class Eventbus extends Bus {

    constructor(...args) {
        super(...args);
    }

    static RPC = RPC;
    static Topic = Topic;
    static Eventbus = Eventbus;

}


const eventbus = new Eventbus();
Object.assign(eventbus, Eventbus);
module.exports = eventbus;


console.log(eventbus);

/*
eventbus.subscribe("endpoint/6458dc42b55679622e893e6d/state/6458dc53a7b3b998ebb67027", (value) => {
    console.log("Topic published:", value);
});


eventbus.publish("endpoint/6458dc42b55679622e893e6d/state/6458dc53a7b3b998ebb67027", 49);


//register(`${name}/${method}`, this[method]);


eventbus.register("components/rooms/foo", (a, b) => {


    //return a + b;
    //throw new Error("Foo bar alsdkflafjsdk")

    return new Promise((resolve, reject) => {
        setTimeout(() => {
            //reject(new Error("foo, math is bad"));
            resolve(a + b);
        }, 3000);
    });

});


eventbus.call("components/rooms/foo", [1, 2], (err, result) => {
    console.log("Calculation done", err || result);
});



console.log(JSON.stringify({
    foo: true,
    bar: "baz",
    fnc: () => {
        console.log("Hello World")
    },
    buff: Buffer.from("Heöö")
}))
*/