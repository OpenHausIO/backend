const BASE = require("./class.base.js");

const promisify = require("../../helper/promisify");

module.exports = class COMMON extends BASE {

    constructor(logger) {

        super();

        this.logger = logger;

    }

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

                const preHooks = (args) => {
                    return new Promise((resolve, reject) => {

                        this.logger.verbose(`${name}(); 1/5; before "pre hooks": %j`, args);

                        pre.catch((err) => {

                            this.logger.verbose(err, `${name}(); Pre hooks aborted`);
                            //logger.debug("Pre hooks aborted?");

                            reject();

                        });

                        pre.start.apply(pre, [...args, (...preArgsModified) => {

                            this.logger.verbose(`${name}(); 2/5; after "pre hooks": %j`, preArgsModified);

                            resolve(preArgsModified);

                        }]);

                    });
                };


                const postHooks = (args) => {
                    return new Promise((resolve, reject) => {

                        this.logger.verbose(`${name}(); 3/5; before "post hooks": %j`, args);

                        post.catch((err) => {

                            this.logger.verbose(err, `${name}(); Post hooks aborted`);

                            reject();

                        });

                        post.start.apply(post, [...args, (...postArgsModified) => {

                            this.logger.verbose(`${name}(); 4/5; after "post hooks": %j`, postArgsModified);

                            resolve(postArgsModified);

                        }]);

                    });
                };


                return promisify((done) => {

                    let final = () => {
                        return Promise.resolve();
                    };

                    let worker = executor((cb) => {
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

                            this.logger.verbose(err, `${name}(); "Reject" in worker code called`);

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

                        this.logger.verbose(`${name}(); 5/5; Resolve callback (successful). Arguments to pass: %j`, args);

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
                            this.logger.warn(err, `${name}(); Something happend on "final"`);
                        });

                    }).catch((err) => {

                        this.logger.debug(`${name}(); Function stack catched/rejected`);

                        if (err instanceof Error) {
                            this.logger.warn(err, `${name}(); Error catched in function stack execution`);
                        }

                    });

                }, cb);

            },
            writable: false,
            enumerable: false,
            configurable: false
        });
    }

};