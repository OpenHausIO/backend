/**
 * @function map
 * Maps a range to another range
 * 
 * @param {Number} value 
 * @param {Number} low1 
 * @param {Number} high1 
 * @param {Number} low2 
 * @param {Number} high2 
 * 
 * @example
 * ```js
 * // convert hex to mb
 * console.log(map(255, 0, 255, 0, 1024)); // 1024
 * ```
 * 
 * @example
 * ```js
 * console.log(map(128, 0, 255, 0, 1024)); // 512
 * ```
 * 
 * @returns {Number} Convert input number
 */
function map(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

module.exports = map;