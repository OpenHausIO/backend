const Middleware = require("./middleware.js");
const { v4: uuidv4 } = require("uuid");

module.exports = class Hooks {

    constructor() {
        // NOTE change to map/set?
        this.namespace = {};
    };

    /**
     * Create request message object for websocket hooks
     * @static
     * @param {obj} data 
     * @returns 
     */
    static WS_REQUEST(data) {

        let obj = Object.assign({
            uuid: null,             // 09c754b1-3930-4156-90f9-daf301a21c63
            type: null,             // ping
            hook: null,             // pre
            component: null,        // users
            method: null,           // add
            args: null              // [<user obj>]
        }, data);

        Object.defineProperty(obj, "uuid", {
            value: uuidv4(),
            configurable: false,
            writable: false,
            enumerable: true
        });

        Object.defineProperty(obj, "type", {
            value: "ping",
            configurable: false,
            writable: false,
            enumerable: true
        });

        return obj;

    };


    /**
     * Create response message object for websocket hooks
     * @static
     * @param {*} data 
     * @returns 
     */
    static WS_RESPONSE(data) {

        let obj = Object.assign({
            uuid: null,             // 09c754b1-3930-4156-90f9-daf301a21c63  
            type: null,             // pong
            hook: null,             // pre
            component: null,        // users
            method: null,           // add
            args: null              // [<modified user obj>]
        }, data);

        Object.defineProperty(obj, "uuid", {
            value: data.uuid,
            configurable: false,
            writable: false,
            enumerable: true
        });

        Object.defineProperty(obj, "type", {
            value: "pong",
            configurable: false,
            writable: false,
            enumerable: true
        });

        return obj;

    };


    _namespace(name) {

        if (!this.namespace[name]) {
            this.namespace[name] = {
                pre: new Middleware(),
                post: new Middleware()
            };
        }

        return this.namespace[name];

    };


    _handleEventType(type, name, cb) {
        if (name instanceof Array) {
            name.forEach((name) => {

                // register for each name a callback
                this._namespace(name)[type].use(cb);

            });
        } else if (typeof name === "string") {

            if (!this._namespace(name)[type]) {
                throw new Error(`Event type "${type}" not supported. Allowed are only pre/post!`);
            }

            // register single namespace event
            this._namespace(name)[type].use(cb);

        } else {
            throw new Error(`Unsupported "name" type. Expected Array/String, got: "${typeof name}"`);
        }
    }

    pre(name, cb) {
        return this._handleEventType("pre", name, cb);
    };


    post(name, cb) {
        return this._handleEventType("post", name, cb);
    };

    trigger(name, ...args) {

        let { pre, post } = this._namespace(name);
        let cb = args[args.length - 1];
        let catcher = null;
        let argEnd = -1;

        // check if the last 2 arguments are functions
        // if not, no aborted callback has defined
        if ((args.length >= 2) && (args[args.length - 1] instanceof Function) && (args[args.length - 2] instanceof Function)) {

            // arrange callback definitions 
            [cb, catcher] = [args[args.length - 2], cb];

            argEnd -= 1;

            pre.catch((err) => {
                catcher(err);
            });

            post.catch((err) => {
                catcher(err);
            });

        }

        pre.start.apply(null, [...args.slice(0, argEnd), (...preArgsModified) => {
            cb.apply(null, [...preArgsModified, (...postArgs) => {

                post.start.apply(null, [...postArgs.slice(0, -1), (...postArgsModified) => {
                    postArgs[postArgs.length - 1].apply(null, postArgsModified);
                }]);

            }]);
        }]);

    };

};