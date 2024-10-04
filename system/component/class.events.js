const { EventEmitter } = require("events");

module.exports = class Events extends EventEmitter {

    static emitted = Symbol("emitted");
    static registered = Symbol("registerd");
    static emitter = new EventEmitter();

    constructor(name) {
        super();
        this.name = name;
        this._registeredEvents = new Set();
    }

    emit(event, ...args) {

        // the idea behin this was that it is used for /api/events ws route
        // but the static "side chain" emitter, can also be used
        // the purpuse of it was to transfer events between workers
        // see #6 when implmented
        // also, the "scenes" component can use it to detect state changes, e.g. for triggers
        if (!this._registeredEvents.has(event)) {

            this._registeredEvents.add(event);

            process.nextTick(() => {
                super.emit(Events.registered, ...args);
            });

        }

        Events.emitter.emit(Events.emitted, {
            component: this.name,
            event,
            args
        });

        return super.emit(event, ...args);

    }

};