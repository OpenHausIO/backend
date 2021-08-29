function extend(target, ...sources) {

    // https://vanillajstoolkit.com/helpers/deepmerge/
    // https://gist.github.com/ahtcx/0cd94e62691f539160b32ecda18af3d6#gistcomment-2930530

    let merge = (obj) => {
        for (let prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                if (obj[prop] instanceof Object && !Array.isArray(obj[prop])) {

                    if (!target[prop]) {
                        target[prop] = {}
                    }

                    // NOTE "extend" works here, use module.exports?!
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

};


module.exports = extend;