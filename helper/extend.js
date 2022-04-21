/**
 * @function extend
 * 
 * @param {Object} target Target to merge sources into
 * @param {...Object} sources Source objects to merge into target
 * 
 * @returns {Object} target
 */
function extend(target, ...sources) {

    // https://vanillajstoolkit.com/helpers/deepmerge/
    // https://gist.github.com/ahtcx/0cd94e62691f539160b32ecda18af3d6#gistcomment-2930530

    let merge = (obj) => {
        for (let prop in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                if ((obj[prop] instanceof Object) && !(Array.isArray(obj[prop])) && !(obj[prop] instanceof Buffer)) {

                    if (!target[prop]) {
                        target[prop] = {};
                    }

                    target[prop] = extend(target[prop], obj[prop]);

                } else {
                    target[prop] = obj[prop];
                }
            }
        }
    };

    // Loop through each object and conduct a merge
    for (let i = 0; i < sources.length; i++) {
        merge(sources[i]);
    }

    return target;

}


module.exports = extend;