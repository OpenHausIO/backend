
/**
 * @function dispatch
 * Dispatch a function/method call on a component item.<br />
 * This prevents the dependency from another component.
 * 
 * @param {Object} object Object
 * @param {String} component Component name: "rooms", "endpoints"
 * @param {String} item Item ObjectID id
 * @param {String} method Method/function to be called on component instance
 * @param {Array} args Arguments array passed to the function/method
 * 
 * @example
 * ```js
await dispatcher({
    "component": "vault",
    "item": "6401cdf4b5c9854efbe71a32",
    "method": "decrypt",
    "args": []
});
 * ```
 * 
 * @returns {Promise|undefined}
 */
module.exports = function dispatch({ component, item, method, args }) {
    try {

        let C_COMPONENT = require(`../components/${component}`);

        return C_COMPONENT.find(item).then((item) => {
            return Reflect.apply(item[method], item, args);
        }).catch((err) => {
            return Promise.reject(err);
        });

    } catch (err) {

        return Promise.reject(err);

    }
};