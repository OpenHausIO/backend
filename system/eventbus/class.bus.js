const RPC = require("./class.rpc.js");
const Topic = require("./class.topic.js");

module.exports = class Bus {

    /**
     * @class Eventbus
     * Eventbus class that allow to subscribe topics and call remote functions.<br />
     * 
     * @property {RPC} _rpc RPC class instance, for internal use!
     * @property {Topic} _topic Topic class instance, for internal use!
     * @property {RPC} RPC RPC class
     * @property {Topic} Topic Topic class
     */
    constructor() {
        this._rpc = new RPC();
        this._topic = new Topic();
    }

    static RPC = RPC;
    static Topic = Topic;

    /**
     * @function call
     * Calls a remote registered function.<br />
     * Wrapper for `_rpc.call();`
     * 
     * @param  {...any} args 
     * @returns 
     */
    call(...args) {
        return Reflect.apply(this._rpc.call, this._rpc, args);
    }


    /**
     * @function register
     * Register a remote callable function.<br />
     * Wrapper for `_rpc.register();`
     * 
     * @param  {...any} args 
     * @returns 
     */
    register(...args) {
        return Reflect.apply(this._rpc.register, this._rpc, args);
    }


    /**
     * @function subscribe
     * Subscribe to a topic.<br />
     * Wrapper for `_topic.subscribe();`
     * 
     * @param  {...any} args 
     * @returns 
     */
    subscribe(...args) {
        return Reflect.apply(this._topic.subscribe, this._topic, args);
    }


    /**
     * @function publish
     * Publish a value for a topic.<br />
     * Warpper for `_topic.publish();`
     * 
     * @param  {...any} args 
     * @returns 
     */
    publish(...args) {
        return Reflect.apply(this._topic.publish, this._topic, args);
    }

};