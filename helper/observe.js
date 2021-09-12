// https://javascript.info/task/observable

/**
 * 
 * @param {object} target 
 * @param {obect} options 
 * @param {function} setter 
 * @param {function} getter 
 * @returns 
 */
function observe(target, options, setter, getter) {

    if (options instanceof Function && !getter) {
        setter = options;
        options = {};
    }

    if (setter instanceof Function && !getter) {
        getter = setter;
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
        throw new Error(`Expected a functions as "setter" paramteter, got "${typeof options}"`);
    }


    if (!(getter instanceof Function)) {
        throw new Error(`Expected a functions as "getter" paramteter, got "${typeof options}"`);
    }


    options = Object.assign({
        intercept: false
    }, options);


    for (let prop in target) {
        if (target[prop] instanceof Object) {
            target[prop] = observe(target[prop], options);
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