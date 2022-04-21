/**
 * @function timeout
 * Wait n ms befor execute the callback function
 * 
 * @param {Number} time Time in ms to wait before calling the callback function
 * @param {Function} cb Callback function
 * 
 * @returns {Function} Function to call before timeout is reached/triggerd
 * 
 * @example
 * ```js
 * const _timeout = require(".../helper/timeout.js");
 * 
 * const caller = timeout(1000, (timedout, duration, args) => {
 *   console.loog(timedout, duration, args); // true, 1001, []
 * });
 * 
 * // call returned function after 2sec
 * // this triggers the timeout
 * setTimeout(caller, 2000);
 * ```
 * 
 * @example 
 * ```js
 * const _timeout = require(".../helper/timeout.js");
 * 
 * const caller = timeout(1000, (timedout, duration, [A, B]) => {
 *   console.loog(timedout, A, B); // false, "Hello", "World"
 * });
 * 
 * // this does not trigger the timeout
 * setTimeout(100, "Hello", "World");
 * 
 * // or directly without a delay
 * //caller("Hello", "World"); * 
 * ``` 
 */
function timeout(time, cb) {

    let called = false;
    let start = Date.now();

    let timer = setTimeout(() => {
        if (!called) {

            called = true;
            cb(true, Date.now() - start, []);

        }
    }, time);


    return (...args) => {

        clearTimeout(timer);
        timer = null;

        if (!called) {

            called = true;
            cb(false, Date.now() - start, [...args]);

        }

    };

}

module.exports = timeout;