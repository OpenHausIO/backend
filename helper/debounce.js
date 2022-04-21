// https://davidwalsh.name/javascript-debounce-function

/**
 * @function debounce
 * Debounce a function call
 * 
 * @param {Function} fnc Function to call when debounced
 * @param {Number} wait Time to wait before calling <func>
 * @param {Boolean} immediate Call <func> immediately?
 * 
 * @example
 * ```js
 * let caller = debounce(() => {
 *   console.log("Debounced");
 * }, 1000);
 * 
 * caller();
 * setTimeout(caller, 500);
 * ```
 */
function debounce(func, wait, immediate = false) {

    let timeout = null;

    return function (...args) {

        let later = () => {

            timeout = null;

            if (!immediate) {
                func.apply(this, args);
            }

        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);

        if (immediate && !timeout) {
            func.apply(this, args);
        }

    };

}

module.exports = debounce;