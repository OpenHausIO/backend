/**
 * @function queue
 * Queue a callback for n calls
 *
 * @param {Number} counter How often the returnd function should be call till <cb> is fired
 * @param {Cunction} cb Callback that gets called when <counter> calles to returned functions happend
 * 
 * @returns Function to call <counter> times till <cb> is executed
 * 
 * @example 
 * ```js
 * const _queue = require(".../helper/queue.js");
 * 
 * let trigger = _queue(3, () => {
 *   console.log("Triggerd after 3 calls");
 * });
 * 
 * trigger();
 * trigger();
 * 
 * setTimeout(trigger, 100);
 * ```
 */
function queue(counter = 0, cb = () => { }) {

    let fired = false;

    return function (...args) {

        // decrement
        counter -= 1;

        if (counter <= 0 && !fired) {
            fired = true;
            cb(...args);
        }

    };

}

module.exports = queue;