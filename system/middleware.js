// https://gist.github.com/aronanda/d31bb47918145a5aace6005f172e035d
module.exports = class Middleware {

  constructor(obj) {

    this.catcher = null;
    obj = obj || this;

    Object.defineProperty(this, "__obj", {
      value: obj
    });

    Object.defineProperty(this, "start", {
      value: (...args) => {

        let cb = args[args.length - 1];
        let params = args.slice(0, -1);

        cb.apply(obj, params);

      },
      writable: true
    });

  };

  /**
   * Add a callback function to middleware stack
   * Last parameter passed to callback is allways a "next" function
   * The "next" function takes as first argument a Error, or null/undefined
   * Any other arguments passed to next, override the arguments for the next stack callback
   * @example 
   * use((next) => {
   *    setTimeout(next, 1000);
   * });
   * 
   * @example 
   * // This override argument "B" and keeps A&C untouched
   * // B argument in the next callback function is now a new object with the properties of B (shallow copy)
   * use((A, B, C, next) => {
   *    next(null, A, {...B});
   * });
   * 
   * @param {function} fn Callback function
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
  };

  /**
   * Set a handler for error passed to a next function
   * Stack execution gets aborted, passed callback function executed, 
   * with error as first argument passed from "next" call
   * @param {function} fn Callback function
   */
  catch(fn) {
    this.catcher = fn;
  };

};