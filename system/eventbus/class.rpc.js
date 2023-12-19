const { randomUUID } = require("crypto");
const { EventEmitter } = require("events");

module.exports = class RPC extends EventEmitter {

    constructor() {
        super();
        this._rpcs = {};
        this._pending = {};
    }

    /**
     * @function register
     * Register a RPC method that can be called
     * 
     * @param {String} uri 
     * @param {Function} cb 
     */
    register(uri, cb) {
        this._rpcs[uri] = cb;
        return cb;
    }


    /**
     * @function call 
     * Calls a rpc function
     * 
     * @param {String} uri 
     * @param {Array} [args=[]]
     * @param {Function} [cb=()=> {}]
     */
    call(uri, args = [], cb) {
        if (this._rpcs[uri]) {

            let id = randomUUID();
            this._pending[id] = cb;

            // TODO: Check if last arg is a function?
            //if(args[args.length - 1] instanceof Function && !cb){
            //  this._pending[id] = args.pop();
            //}

            try {

                let ret = Reflect.apply(this._rpcs[uri], null, args);

                if (ret instanceof Promise) {

                    ret.then((val) => {
                        Reflect.apply(this._pending[id], null, [null, val]);
                    }).catch((err) => {
                        Reflect.apply(this._pending[id], null, [err]);
                    }).finally(() => {
                        delete this._pending[id];
                    });

                } else {

                    Reflect.apply(this._pending[id], null, [null, ret]);
                    delete this._pending[id];

                }

            } catch (err) {

                Reflect.apply(this._pending[id], null, [err]);
                delete this._pending[id];

            }

            if (!cb) {
                return new Promise((resolve) => {
                    this._pending[id] = resolve;
                });
            }

        } else {

            throw new Error(`RPC ${uri} not found`);

        }
    }

    /*
    regrpc(uri, rpc) {
        console.log("Registering " + uri);
        this._rpcs[uri] = rpc;
        this.emit('RPCRegistered', [uri])
    };

    unregrpc(uri) {
        console.log("Unregistering " + uri);
        delete this._rpcs[uri];
        this.emit('RPCUnregistered', [uri]);
    };

    callrpc(uri, args, callback) {
        if (typeof this._rpcs[uri] !== 'undefined') {

            let invId = randomUUID();
            this._pending[invId] = callback;
            this._rpcs[uri].apply(this, [invId, args]);

            return true;

        } else {

            return false;

        }
    };

    resrpc(invId, err, args) {
        if (typeof _pending[invId] !== 'undefined') {
            this._pending[invId].apply(this, [err, args]);
            delete _pending[invId];
        }
    };
    */

};