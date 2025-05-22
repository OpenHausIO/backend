const process = require("process");
//const events = require("events");

const Hooks = require("../class.hooks.js");
const Events = require("./class.events.js");

/**
 * @description
 * Base class for all components.<br />
 * Provides basic properties & handle initialization phase.
 * 
 * @class BASE
 * 
 * @property {String} name Name of the component
 * @property {Boolean} ready Indicate if the component is ready to use
 * @property {EventEmitter} events node.js EventEmitter instance
 * @property {Object} hooks Hooks class instance 
 * 
 * @emits ready When ready to use 
 * @emits error When something happend while initzilizliz
 * 
 * @see Hooks system/hooks.js
 * @link https://nodejs.org/dist/latest-v16.x/docs/api/events.html#class-eventemitter
 */
module.exports = class BASE {

    constructor(name) {
        this.name = name;
        this.ready = false;
        this.events = new Events(name);
        this.hooks = new Hooks();
        // this.logger = ...?
    }

    // NOTE improve/change function name
    // impement in child class "_init" and call that?
    // like stream implementaiton "_write" / "_read"?
    // https://nodejs.org/dist/latest-v14.x/docs/api/stream.html#stream_writable_write_chunk_encoding_callback_1
    /**
     * @function init
     * Init the component, like fill the `.items` array
     * 
     * @param {Function} cb Worker callback
     */
    init(cb) {
        cb(this, (err) => {
            if (err) {

                // see issue #53, this should not throw
                this.events.emit("error", err);
                //process.exit(1000); ?!

            } else {

                this.ready = true;

                process.nextTick(() => {
                    this.events.emit("ready");
                });

            }
        });
    }

};