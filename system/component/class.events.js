const { EventEmitter } = require("events");
const { isMainThread, BroadcastChannel, threadId } = require("worker_threads");
const logger = require("../logger/index.js");

const channel = new BroadcastChannel("events");

module.exports = class Events extends EventEmitter {

    static channel = channel;
    static emitted = Symbol("emitted");
    static registered = Symbol("registerd");
    static emitter = new EventEmitter();

    constructor(name) {

        super();

        this.name = name;
        this._registeredEvents = new Set();

        if (process.env.WORKER_THREADS_ENABLED === "true") {
            channel.addEventListener("message", ({ data }) => {
                if (data.origin !== threadId && name === data.message.component) {

                    // without this, <host>/api/system/events does not work correctly
                    // this results that if a plugin adds a device, its not shown in the UI
                    if (isMainThread) {
                        Events.emitter.emit(Events.emitted, {
                            component: this.name,
                            event: data.message.event,
                            args: data.message.args
                        });
                    }

                    // call `.emit` creates a loop, because `emitter(emitted)` pics up the event
                    //events.emit(event.event, ...event.args)
                    EventEmitter.prototype.emit.call(this, data.message.event, ...data.message.args);

                }
            });
        }

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

        if (process.env.WORKER_THREADS_ENABLED === "true") {
            // ready = each component instance emits ready on its own
            // error = each component instance emits error on its own
            // connect = pass Websocket instance as argument in mqtt, which breaks serialazion (and is only needed once in main)
            // disconnect = pass websocket instance as argument in mqtt, which breaks serialazion (and is only needed once in main)
            // TODO: scope events into components to prevent event name conflicts?
            if (!["ready", "error", "connected", "disconnected"].includes(event)) {
                try {

                    // fix/workaround for dataclone error because of proxies, see #556
                    if (this.name === "scenes") {

                        // item.timestamps = proxy
                        // item.scenes = proxy
                        // structuredClone fails/cant handle proxies
                        args = JSON.parse(JSON.stringify(args));

                    }

                    channel.postMessage({
                        origin: threadId,
                        message: {
                            component: this.name,
                            event,
                            args
                        }
                    });

                } catch (err) {
                    if (process.env.NODE_ENV === "development") {

                        //console.log(event, args);
                        //console.error("Error, could not post message", err);
                        logger.warn(err, "Could not serialize event", {
                            component: this.name,
                            event,
                            args
                        });

                    }
                }
            }
        }

        return super.emit(event, ...args);

    }

};