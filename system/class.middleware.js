// https://gist.github.com/aronanda/d31bb47918145a5aace6005f172e035d

/**
 * @description
 * Implementation of the middleware pattern you can find in connect/express.
 * It can be used "standalone" in your own code or is found in components with a namespace wrapper.
 * 
 * @class Middleware
 * 
 * @param {Object} [obj=this] Optional <this> scope for middleware functions added with `.use`
 * 
 * @property {Object} __obj <this> scope for middleware functions
 * 
 * @example
 * ```js
 * const middleware = new Middleware();
 * 
 * middleware.use((data, next) => {
 *   console.log("use(); 1", data);
 *   next();
 * });
 * 
 * middleware.use((data, next) => {
 *   data.foo = "YEEEHAAA";
 *   console.log("use(); 2", data);
 *   next();
 * });
 * 
 * middleware.use((data, next) => {
 *   console.log("use(); 3", data);
 *   next();
 * });
 * 
 * middleware.start({bar: true}, (obj) => {
 *   console.log("Chain done", obj);
 * });
 * ```
 * 
 * @see Hooks system/hooks.js
 * @link https://github.com/senchalabs/connect#use-middleware
 * @link https://expressjs.com/en/guide/using-middleware.html
 */
module.exports = class Middleware {

    constructor(obj) {

        this.catcher = null;
        obj = obj || this;

        Object.defineProperty(this, "__obj", {
            value: obj
        });

        /**
         * @function start
         * Start/execute the middleware stack 
         * 
         * @example
         * ```js
         * start(Date.now(), {foo: "bar", baz: true}, (ts, obj) => {
         *   console.log(ts, obj);
         * });
         * ```
         * 
         * @example
         * ```js
         * start("A", "B", "C", (a, b, c) => {
         *   console.log(a, b, c);
         * });
         * ```
         */
        Object.defineProperty(this, "start", {
            value: (...args) => {

                let cb = args[args.length - 1];
                let params = args.slice(0, -1);

                cb.apply(obj, params);

            },
            writable: true
        });

    }

    /**
     * @function use
     * Add a callback function to middleware stack.
     * Last parameter passed to callback is allways a "next" function.
     * The "next" function takes as first argument a Error, or null/undefined.
     * Any other arguments passed to next, override the arguments for the next stack callback
     * 
     * @param {Function} fn Callback function
     * 
     * @example 
     * ```js
     * use((next) => {
     *    setTimeout(next, 1000);
     * });
     * ```
     * 
     * @example 
     * ```js
     * // This override argument "B" and keeps A&C untouched
     * // B argument in the next callback function is now a new object with the properties of B (shallow copy)
     * use((A, B, C, next) => {
     *    next(null, A, {...B});
     * });
     * ```
     */
    use(fn) {
        this.start = (stack => {
            return (...args) => {


                stack(...args.slice(0, -1), (...override) => {

                    //console.log("stack();", override);

                    // NOTE: NEEDS TO BE PRESENT FOR OVERRIND ARUGMENTS
                    args.splice(0, override.length, ...override);


                    // proxy function
                    // to intercept the error argument
                    // name is visiable in console.log
                    let next = (err, ...override) => {

                        if (err instanceof Error && this.catcher) {
                            return this.catcher(err);
                        } else if (!(err == undefined || err == null)) {
                            throw new Error(`First argument should be null/undefined or error instance, got: ${err}`);
                        }


                        // override "use" function arguments
                        // when passed passed to next call
                        // next(null, {blabla: true}, Date.now())
                        // see tests/test.middleware.js for more info
                        // NOTE: WORKS ONLY FOR IF OVERRIDE ABOCE IS PRESENT
                        // Why?! This fucking middlware bullshit is black magic...
                        args.splice(0, override.length, ...override);


                        args[args.length - 1].bind(this.__obj, ...args.slice(0, -1))();

                    };

                    fn.call(this.__obj, ...args.slice(0, -1), next);

                });


            };
        })(this.start);
    }

    /**
     * @function catch
     * Set a handler for error passed to a next function
     * Stack execution gets aborted, passed callback function executed, 
     * with error as first argument passed from "next" call
     * 
     * @param {Function} fn Callback function
     * 
     * @example
     * ```js
     * catch((err) => {
     *   console.log(err);
     * });
     * ```
     */
    catch(fn) {
        this.catcher = fn;
    }

};