/**
 * @function injectMethod 
 * Add a method to a given object into the prototype
 * Default values are set to the exact same values when the method would be defined in the object/class body
 * 
 * @param {Object} obj Object to add property to
 * @param {String} prop The property name
 * @param {*} value Value of the property
 * @param {Object} [options={}] Property descriptor options
 * @param {Boolean} [options.writable=true] 
 * @param {Boolean} [options.enumerable=false]
 * @param {Boolean} [options.configurable=true]
 * 
 * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty#description
 */

function injectMethod(obj, prop, value, options = {}) {

    if (!(value instanceof Function)) {
        throw new TypeError(`Value must be a function, received ${typeof value}`);
    }

    // NOTE: Setting on prototype of given object, breaks iface.bridge()...
    // Object.defineProperty(Object.getPrototypeOf(obj), prop, {
    Object.defineProperty(obj, prop, {
        value,
        writable: true,
        enumerable: false,
        configurable: true,
        ...options
    });

}

module.exports = injectMethod;