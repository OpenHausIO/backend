const _expose = require("../../helper/expose.js");

const BASE = require("./class.base.js");

const promisify = require("../../helper/promisify");

/**
 * @description
 * Class description
 * 
 * @class COMMON
 * 
 * @extends BASE system/component/class.base.js
 * 
 * @param {Object} logger Logger instance
 * 
 * @property {Logger} logger Logger instance
 * 
 * @see Logger system/logger/
 */
module.exports = class COMMON extends BASE {

    constructor(logger) {

        super();

        this.logger = logger;

    }

    /**
     * @function _defineMethod
     * Defines a hookable/event emitting method on component scope
     * 
     * @param {String} name Name of the method that gets patche into the scope
     * @param {Function} executor Wokrer function that does the actual implementation
     */
    _defineMethod(name, executor) {
        Object.defineProperty(this, name, {
            value: (...args) => {

                let cb = null;
                let end = args.length;

                if (args[args.length - 1] instanceof Function) {
                    cb = args[args.length - 1];
                    end -= 1;
                }

                let { pre, post } = this.hooks._namespace(name);

                let log = this.logger.tracer(`${name}()`, 5, () => {
                    return `${name}(); Execution done.`;
                });

                const preHooks = (args) => {
                    return new Promise((resolve, reject) => {

                        //this.logger.verbose(`${name}(); 1/5; before "pre hooks": %j`, args);
                        log(`before "pre hooks": %j`, args);

                        pre.catch((err) => {

                            this.logger.verbose(err, `${name}(); Pre hooks aborted`);
                            //logger.debug("Pre hooks aborted?");

                            reject(err);

                        });

                        pre.start.apply(pre, [...args, (...preArgsModified) => {

                            //this.logger.verbose(`${name}(); 2/5; after "pre hooks": %j`, preArgsModified);
                            log(`after "pre hooks": %j`, preArgsModified);

                            resolve(preArgsModified);

                        }]);

                    });
                };


                const postHooks = (args) => {
                    return new Promise((resolve, reject) => {

                        //this.logger.verbose(`${name}(); 3/5; before "post hooks": %j`, args);
                        log(`before "post hooks": %j`, args);

                        post.catch((err) => {

                            this.logger.verbose(err, `${name}(); Post hooks aborted`);

                            reject(err);

                        });

                        post.start.apply(post, [...args, (...postArgsModified) => {

                            //this.logger.verbose(`${name}(); 4/5; after "post hooks": %j`, postArgsModified);
                            log(`after "post hooks": %j`, postArgsModified);

                            resolve(postArgsModified);

                        }]);

                    });
                };


                return promisify(async (done) => {

                    let final = () => {
                        return Promise.resolve();
                    };

                    let worker = executor((cb) => {
                        final = cb;
                    });

                    try {

                        // trigger pre hooks & catch rejection
                        args = await preHooks(args.slice(0, end)).catch((err) => {

                            // feedback
                            this.logger.verbose(`${name}(); Pre hooks rejected`, err);

                            throw err;

                        });

                        // trigger worker function & catch rejection
                        args = await worker(...args).catch((err) => {

                            this.logger.verbose(err, `${name}(); worker code rejected`, err);

                            // re throw
                            throw err;

                        });

                        // trigger post hooks & catch rejection
                        args = await postHooks(args).catch((err) => {

                            // feedback
                            this.logger.verbose(`${name}(); Post hooks rejected`, err);

                            throw err;

                        });

                        // finalize function
                        await final(...args).catch((err) => {

                            // feedback
                            this.logger.verbose(`${name}(); Something happend on "final"`, err);

                            throw err;

                        });

                        // "resolve" promisify 
                        done(null, ...args);

                        // emit event
                        this.events.emit(name, ...args);

                    } catch (err) {
                        done(err);
                    }


                    // defineMethod stack:
                    // 1) trigger pre hooks with args from function call
                    //    - proceed pre hooks stack execution
                    // 2) pass possible modidfied arguments to worker code
                    // 3) trigger post hoooks with args from worker code
                    // 4) call registerd "final" call with possible modified arguments
                    // 5) Wait for registerd "final" call/resolve
                    // 6) Call functions passed "callback" (or promise if no cb passed)

                    // TODO IMPROVE ERROR HANLDING
                    // IF something happens far up, the next catch handle is
                    // BUT, the rest still tryies to get executed and produce even more errors

                    // NOTE: Call on every error, "done" with error argument?! Should be...

                    /*
                    Promise.resolve().then(() => {

                        // execute pre hooks middleware
                        // catch error that happens for logging
                        return preHooks(args.slice(0, end));

                    }).then((args) => {
                        try {

                            // NOTE:
                            // Switch this mess to async/await?!
                            // should be a lot easyier to handler #239
                            // this then/catch callbacks are a mess!

                            // execute worker code itself
                            return worker(...args).catch((err) => {

                                this.logger.verbose(`${name}(); "Reject" in worker code called:`, err);

                                // if worker code reject call promisify
                                // with error as first argument
                                done(err);

                                // reject/abort post hooks
                                return Promise.reject();

                            });


                        } catch (err) {

                            this.logger.error(err);

                        }
                    }).then((args) => {

                        // execute post hooks middleware
                        // catch error that happens for logging
                        return postHooks(args);

                    }).then((args) => {

                        //this.logger.verbose(`${name}(); 5/5; Resolve callback (successful). Arguments to pass: %j`, args);
                        log(`Resolve callback (successful).Arguments to pass: %j`, args);

                        // before we call "callback" (resolve _promsify)
                        // execute in worker code "final" function to pefrom operations
                        // this *should* not result in any error (reject)
                        // NOTE: re-throw error to catch in "Error catched in function stack execution"?!
                        // To abort anything is to late... 
                        // The only thing that can happen there is a program error (typo, undefined, etc...)
                        final(...args).then(() => {

                            // "resolve" promisify 
                            done(null, ...args);

                            this.events.emit(name, ...args);

                        }).catch((err) => {
                            this.logger.warn(err, `${name}(); Something happend on "final"`);
                        });

                    }).catch((err) => {

                        this.logger.debug(`${name}(); Function stack catched/rejected`);

                        if (err instanceof Error) {
                            this.logger.warn(err, `${name}(); Error catched in function stack execution`);
                        }

                        done(err);

                    });
                    */

                }, cb);

            },
            writable: false,
            enumerable: false,
            configurable: false
        });
    }

    /**
     * @function _mapMethod
     * Maps a item method to the component scope
     * The mapped method is full hookable & emit evenits
     * Just like the build in component methods
     * 
     * @param {String} name Name to set on the component object
     * @param {String} method Method name on item
     * @param {Array} arr Array too look for the target item object
     */
    _mapMethod(name, method, arr) {

        let target = _expose(arr, method);

        this._defineMethod(name, () => {
            return (_id, ...args) => {
                return new Promise((resolve, reject) => {

                    args.push((err, ...args) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(args);
                        }
                    });

                    target(_id, ...args);

                });
            };
        });

    }

    /**
     * @function _ready
     * Calls the provided callback as soon as the component is ready to be used.<br />
     * If this function is called while the component is ready, the callback is immediately called.
     * 
     * @param {Function} cb Callback to register
     */
    _ready(cb) {
        Promise.race([
            new Promise((resolve) => {
                if (this.ready) {

                    // keep asynchron things asynchron
                    process.nextTick(resolve);

                }
            }),
            new Promise((resolve) => {
                this.events.once("ready", () => {

                    resolve();

                });
            })
        ]).then(() => {
            cb(this);
        });
    }

};