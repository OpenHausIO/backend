
/**
 * @function dispatch
 * Dispatch a function/method call on a component item.<br />
 * This prevents the dependency from another component.
 * 
 * @param {Object} object Object
 * @param {String} object.component Component name: "rooms", "endpoints"
 * @param {String} object.item Item ObjectID id
 * @param {String} object.method Method/function to be called on component instance
 * @param {Array} object.args Arguments array passed to the function/method
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

        return C_COMPONENT.get(item).then((item) => {

            let result = Reflect.apply(item[method], item, args);

            /*
            // draft for component/scene
            // "example" for trigger that allow to check when a scene is executed
            this.emit(component, {
                item,
                method,
                args
            });
            */

            return result;

        }).catch((err) => {
            return Promise.reject(err);
        });

    } catch (err) {

        return Promise.reject(err);

    }
};