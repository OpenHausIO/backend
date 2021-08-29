const util = require("util");
const process = require("process");
const events = require("events");

const Hooks = require("../hooks.js");


module.exports = class COMPONENT {

    constructor() {
        this.ready = false;
        this.events = new events();
        this.hooks = new Hooks();
    };

    // NOTE improve/change function name
    // impement in child class "_init" and call that?
    // like stream implementaiton "_write" / "_read"?
    // https://nodejs.org/dist/latest-v14.x/docs/api/stream.html#stream_writable_write_chunk_encoding_callback_1
    init(cb) {
        cb(this, (err) => {
            if (err) {

                this.emit("error", err);
                //process.exit(1000); ?!

            } else {

                this.ready = true;

                process.nextTick(() => {
                    this.events.emit("ready");
                });

            }
        });
    };


    // NOTE define as separe helper?
    _promisify(worker, cb) {

        let wrapper = new Promise((resolve, reject) => {
            worker((err, ...args) => {
                if (err) {
                    reject(err);
                } else {

                    // NOTE: GOOD PRACTICE?!
                    if (args.length === 1 && !cb) {
                        resolve(args[0]);
                    } else {
                        resolve(args);
                    }

                }
            });
        });


        if (cb) {

            wrapper.then((args) => {
                cb(null, ...args);
            }).catch((err) => {
                cb(err);
            });

        } else {
            return wrapper;
        }

    };


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


                return this._promisify((done) => {

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

                            // if worker code reject call _promisify
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

                            // "resolve" _promisify 
                            done(null, ...args);

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
            writable: false
        });
    };


    //TODO überarbeiten
    // cb in cb in cb hell
    // scope: call/apply/bind fucking brain damage
    _defineMethod(name, executor, logger) {
        Object.defineProperty(this, name, {
            value: util.deprecate((...args) => {

                let cb = null;
                let end = args.length;

                if (args[args.length - 1] instanceof Function) {
                    cb = args[args.length - 1];
                    end -= 1;
                }

                return this._promisify((done) => {

                    if (logger) {
                        logger.verbose(`${name}(); 1/4; before "pre hooks": %j`, ...args.slice(0, end));
                    }

                    let { pre, post } = this.hooks._namespace(name);



                    this.hooks.trigger.apply(this.hooks, [name, ...args.slice(0, end), (...preArgsModified) => {

                        let next = preArgsModified[preArgsModified.length - 1];

                        if (logger) {
                            logger.verbose(`${name}(); 2/4; after "pre hooks": %j`, preArgsModified.slice(0, -1));
                        }

                        executor((worker) => {

                            worker.apply(this, [...preArgsModified.slice(0, -1)]);

                        }, (err, ...postArgs) => {

                            // prevent to invoke post middleware
                            // middleware should run only when nothing happend
                            // in the worker code, e.g. db operation
                            if (err instanceof Error) {
                                return done(err);
                            }


                            if (logger) {
                                logger.verbose(`${name}(); 3/4; before "post hooks": %j`, ...postArgs);
                            }


                            // next trigger post  hooks
                            // NOTE: apply(this) context ?! set to what?!
                            next.apply(this.hooks, [...postArgs, (...postArgsModified) => {

                                if (logger) {
                                    logger.verbose(`${name}(); 4/4; after "post hooks": %j`, ...postArgsModified);
                                }

                                done.apply(this, [null, ...postArgsModified]);
                                this.events.emit.apply(this.events, [`${name}ed`, ...postArgsModified]);

                            }]);

                        });

                    }, (err) => {

                        logger.warn(`${name}(); Middleware throwed error: ${err.message}`);
                        logger.verbose(`${name}(); Execuation aborted from middleware`);

                        done(err);

                    }]);

                }, cb);

            }, `defineMethod(); is deprecated, use "defineMethhod2()`),
            writable: false
        });
    };


    // NOTE define as seperate helpder?
    _extend(target, ...sources) {

        // https://vanillajstoolkit.com/helpers/deepmerge/
        // https://gist.github.com/ahtcx/0cd94e62691f539160b32ecda18af3d6#gistcomment-2930530

        let merge = (obj) => {
            for (let prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    if (obj[prop] instanceof Object && !Array.isArray(obj[prop])) {

                        if (!target[prop]) {
                            target[prop] = {}
                        }

                        target[prop] = this._extend(target[prop], obj[prop]);

                    } else {
                        target[prop] = obj[prop];
                    }
                }
            }
        };

        // Loop through each object and conduct a merge
        for (var i = 0; i < sources.length; i++) {
            merge(sources[i]);
        }

        return target;

    };


    // NOTE define as seperate helpder?
    _filter(obj, predicate) {
        // https://stackoverflow.com/a/37616104/5781499
        return Object.keys(obj).filter(key => predicate(obj[key])).reduce((res, key) => (res[key] = obj[key], res), {});
    };

};