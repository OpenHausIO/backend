// https://javascript.info/task/observable

/**
 * @function observe
 * Observe a object like thing
 * 
 * @param {Object} target 
 * @param {Object} options 
 * @param {Function} setter 
 * @param {Function} getter 
 * 
 * @returns {Proxy} Observed object
 */
function observe(target, options, getter, setter) {

    if (options instanceof Function && !getter) {
        getter = options;
        options = {};
    }

    if (!(options instanceof Object)) {
        throw new Error(`Expected a object as options paramteter, got "${typeof options}"`);
    }

    if (!setter) {
        setter = () => { };
    }

    if (!getter) {
        getter = () => { };
    }

    if (!(setter instanceof Function)) {
        throw new Error(`Expected a functions as "setter" parameter, got "${typeof options}"`);
    }

    if (!(getter instanceof Function)) {
        throw new Error(`Expected a functions as "getter" parameter, got "${typeof options}"`);
    }


    options = Object.assign({
        intercept: false,
        recursiv: true
    }, options);


    if (options.recursiv) {
        for (let prop in target) {
            if (target[prop] instanceof Object) {
                target[prop] = observe(target[prop], options, getter, setter);
            }
        }
    }

    return new Proxy(target, {
        set(target, prop, value, receiver) {
            if (options.intercept) {

                if (!setter(prop, value, target, receiver)) {
                    return false;
                }

                return Reflect.set(...arguments);

            } else {

                let success = Reflect.set(...arguments);

                if (success) {
                    setter(prop, value, target, receiver);
                }

                return success;

            }
        },
        get(target, prop, receiver) {
            if (options.intercept) {

                if (!getter(target, prop, receiver)) {
                    return target[prop];
                }

                return undefined;

            } else {

                getter(target, prop, receiver);
                return Reflect.get(target, prop);

            }
        }
    });

}


module.exports = observe;