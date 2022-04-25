/**
 * @function
 * Iterate over a object like item and return its propertys
 * 
 * @param {Object} obj Iterable object
 * 
 * @returns {Iterator} Iteratable object with the propertys values
 * 
 * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators
 */
function propertys(obj) {

    let properties = new Set();
    let currentObj = obj;

    do {
        Object.getOwnPropertyNames(currentObj).forEach((item) => {
            properties.add(item);
        });
    } while ((currentObj = Object.getPrototypeOf(currentObj)));

    //return [...properties.keys()].filter(item => typeof obj[item] === 'function')
    return properties.keys();

}

module.exports = propertys;