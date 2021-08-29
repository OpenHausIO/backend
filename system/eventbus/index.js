const EventEmitter = require("events");

const Event = require("./class.event.js");

class EventBus extends EventEmitter {

    constructor() {

        super();

        this.subscriber = new Map();

        this.on("message", (data) => {

            this.subscriber.get(data.component).forEach((cb) => {
                cb(data.event);
            });

        });


    };


    subscribe(name, cb) {

        if (!this.subscriber.has(name)) {
            this.subscriber.set(name, new Set());
        }

        this.subscriber.get(name).add(cb);

    };

    pulish(name, data) {
        this.emit("message", {
            component: name,
            event: new Event(data)
        });
    };


}


const bus = module.exports = new EventBus();


bus.subscribe("users", (event) => {
    console.log("USer event", event);
});

bus.subscribe("endpoint", (event) => {
    console.log("Endpoint event", event);
});


bus.pulish("users", "Hello from publischer to user");
bus.pulish("endpoint", {
    command: "uuid",
    interface: "interface uuid"
});

console.log(bus)