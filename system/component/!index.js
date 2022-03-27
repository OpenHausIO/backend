const process = require("process");
const events = require("events");

const Hooks = require("../hooks.js");


const promisify = require("../../helper/promisify");


module.exports = class COMPONENT {

    constructor() {
        this.ready = false;
        this.events = new events();
        this.hooks = new Hooks();
        //this.items = []; // use observer pattern to watch items array?
    }

    // NOTE improve/change function name
    // impement in child class "_init" and call that?
    // like stream implementaiton "_write" / "_read"?
    // https://nodejs.org/dist/latest-v14.x/docs/api/stream.html#stream_writable_write_chunk_encoding_callback_1
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



    _defineMethod2(name, executor, logger) {
        Object.defineProperty(this, name, {
            value: (...args) => {

                let cb = null;
                let end = args.length;

                if (args[args.length - 1] instanceof Function) {
                    cb = args[args.length - 1];
                    end -= 1;
                }

                let { pre, post } = this.hooks._namespace(name);

                const preHooks = (args) => {
                    return new Promise((resolve, reject) => {

                        if (logger) {
                            logger.verbose(`${name}(); 1/5; before "pre hooks": %j`, args);
                        }

                        pre.catch((err) => {

                            if (logger) {
                                logger.verbose(err, `${name}(); Pre hooks aborted`);
                                //logger.debug("Pre hooks aborted?");
                            }

                            reject();

                        });

                        pre.start.apply(pre, [...args, (...preArgsModified) => {

                            if (logger) {
                                logger.verbose(`${name}(); 2/5; after "pre hooks": %j`, preArgsModified);
                            }

                            resolve(preArgsModified);

                        }]);

                    });
                };


                const postHooks = (args) => {
                    return new Promise((resolve, reject) => {

                        if (logger) {
                            logger.verbose(`${name}(); 3/5; before "post hooks": %j`, args);
                        }

                        post.catch((err) => {

                            if (logger) {
                                logger.verbose(err, `${name}(); Post hooks aborted`);
                                //logger.debug("Pre hooks aborted?");
                            }

                            reject();

                        });

                        post.start.apply(post, [...args, (...postArgsModified) => {

                            if (logger) {
                                logger.verbose(`${name}(); 4/5; after "post hooks": %j`, postArgsModified);
                            }

                            resolve(postArgsModified);

                        }]);

                    });
                };


                return promisify((done) => {

                    let final = () => {
                        return Promise.resolve();
                    };

                    let worker = executor((cb) => {

                        if (logger) {
                            //logger.verbose(`${name}(); Uses "final" callback`);
                        }

                        final = cb;

                    });

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

                    Promise.resolve().then(() => {

                        // execute pre hooks middleware
                        // catch error that happens for logging
                        return preHooks(args.slice(0, end));

                    }).then((args) => {

                        // execute worker code itself
                        return worker(...args).catch((err) => {

                            if (logger) {
                                logger.verbose(err, `${name}(); "Reject" in worker code called`);
                            }

                            // if worker code reject call promisify
                            // with error as first argument
                            done(err);

                            // reject/abort post hooks
                            return Promise.reject();

                        });

                    }).then((args) => {

                        // execute post hooks middleware
                        // catch error that happens for logging
                        return postHooks(args);

                    }).then((args) => {


                        if (logger) {
                            logger.verbose(`${name}(); 5/5; Resolve callback (successful). Arguments to pass: %j`, args);
                        }

                        // before we call "callback" (resolve _promsify)
                        // execute in worker code "final" function to pefrom operations
                        // this *should* not result in any error (reject)
                        // NOTE: re-throw error to catch in "Error catched in function stack execution"?!
                        // To abort anything is to late... 
                        // The only thing that can happen there is a program error (typo, undefined, etc...)
                        final(...args).then(() => {

                            // "resolve" promisify 
                            done(null, ...args);

                            this.events.emit(name, args);

                        }).catch((err) => {
                            if (logger) {
                                logger.warn(err, `${name}(); Something happend on "final"`);
                            }
                        });

                    }).catch((err) => {

                        if (logger) {
                            logger.debug(`${name}(); Function stack catched/rejected`);
                        }

                        if (err instanceof Error) {
                            logger.warn(err, `${name}(); Error catched in function stack execution`);
                        }

                    });

                    /*
    
                    // TODO PROMSIE CATHING NOT WORKING!
                    preHooks(args.slice(0, end)).catch((err) => {
    
                        if (logger) {
                            logger.verbose(`${name}(); Something happend on "pre hooks": %j`, err);
                        }
    
                    }).then((args) => {
    
                        // let the worker code do what it should
                        return worker(...args);
    
                    }).catch((err) => {
    
                        if (logger) {
                            logger.verbose(`${name}(); Something happend on "worker code": %j`, err);
                        }
    
                        done(err);
    
                    }).then(postHooks).catch((err) => {
    
                        if (logger) {
                            logger.verbose(`${name}(); Something happend on "post hooks": %j`, err);
                        }
    
                    }).then((args) => {
    
    
                        // first do "worker code" after post hooks stuff
                        // after that, call/resolve the functions original callback/promisie
    
                        if (logger) {
                            logger.verbose(`${name}(); Callback arguments to pass: %j`, args);
                        }
    
                        final(...args).then(() => {
                            done(null, ...args);
                        });
    
                    }).catch((err) => {
    
                        if (logger) {
                            logger.warn(`${name}(); FUCKING!`, err);
                        }
    
                    });
    
                    */


                }, cb);

            },
            writable: false,
            enumerable: false,
            configurable: false
        });
    }


    _defineItemMethod(name, logger) {
        Object.defineProperty(this, name, {
            value: (...args) => {
                try {

                    let _id = args[0];

                    let item = this.items.find((item) => {
                        return item._id === _id;
                    });

                    if (!item) {
                        let err = new Error(`Item "${_id}" not found to call method "${name}" on it`);
                        if (logger) {
                            logger.warn(err);
                        }
                        return;
                    }

                    if (Object.prototype.hasOwnProperty.call(item, name) && item[name] instanceof Function) {
                        return item[name].apply(item, args);
                    } else {

                        if (logger) {
                            logger.warn(`Property "${name}" was not found on item "${item._id}" or is not a function`);
                        }

                    }

                } catch (err) {

                    if (logger) {
                        logger.warn();
                    }

                    // re-throw 
                    throw err;

                }
            },
            writable: false,
            enumerable: false,
            configurable: false
        });

    }



};