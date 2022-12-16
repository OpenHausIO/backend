/**
 * @function reactive
 * Returns the given object wrapped in a proxy object.<br />
 * Get/set & apply calls to the object are intercepted and additional callbacks called.
 * 
 * @param {Object|Array} obj Instace of `Object`. Anything that can in js be called "Object"
 * @param {Function} getter Same as proxy `get()`
 * @param {Function} setter Same as proxy `set()`
 * @param {Function} apply Same as proxy `apply()`
 * 
 * @returns {Proxy} Wrapped given <obj> Object.
 * 
 * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/get
 * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/set
 * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/apply
 */
function reactive(obj, getter = () => {
    // dummy
    // args: target, prop, receiver
}, setter = () => {
    // dummy
    // args: target, prop, value
}, apply = () => {
    // dummy
    // args: target, scope, args
}) {

    for (let prop in obj) {
        if (obj[prop] instanceof Object && !(obj[prop] instanceof Buffer)) {
            obj[prop] = reactive(obj[prop], getter, setter, apply);
        }
    }

    return new Proxy(obj, {
        get(target, prop, receiver) {

            //console.log("getter();", "target: ", target, "prop:", prop);
            getter(target, prop, receiver);
            return target[prop];

        },
        set(target, prop, value) {

            //console.log("setter();", "obj: ", obj, "prop:", prop, "value: ", value);
            setter(target, prop, value);
            target[prop] = value;

        },
        apply(target, scope, args) {

            //console.log("apply: target: ", target, "scope:", scope, "args: ", args);
            apply(target, scope, args);
            return target.apply(scope, args);

        }
    });

}

module.exports = reactive;