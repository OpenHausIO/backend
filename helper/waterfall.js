/**
 * @function waterfall
 * Executes the functions in the array one after the previous has finished.
 * Just like in asyncs `waterfall` function.
 * 
 * @example
 * ```js
_waterfall([(next) => {
    console.log("1");
    setTimeout(next, 1000);
}, (next) => {
    console.log("2");
    setTimeout(next, 1000);
}, (next) => {
    console.log("3");
    setTimeout(next, 1000);
}], () => {
    console.log("Waterfall done");
});
 * ```
 * 
 * @param {Array} arr Array with functions
 * @param {Function} [cb] Optional function that gets called when all previous functions has run
 */
function waterfall(arr, cb = () => { }) {
    Array.prototype.reduce(Array, arr).map((fnc) => {

        return () => {
            return new Promise((resolve) => {
                fnc(resolve);
            });
        };

    }).reduce((prev, cur) => {

        return prev.then(cur);

    }, Promise.resolve()).then(cb);
}

module.exports = waterfall;