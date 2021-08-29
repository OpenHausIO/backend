/**
 * Mix/merge a bunch of objects
 * @param {array} objs Array of objects to "merge"
 * @param {object} options Options object
 * @param {boolean} options.transparent Hide "overlay" objects, merge everything into a single object.
 * If false: Merge return single object, with "root" obj set as protoype
 * true: Use a proxy for requests, "hide" everything, only visible object is "root", like the opposite as "false"
 * @param {boolean} options.setPrototype Set prototype of newly created object to `obs[1]`, all other properties a merged/overriden
 * @param {function} lookup Lookup callback for transparent mode
 * @returns 
 */
function mixins(objs, options, lookup = () => { }) {

    if (options instanceof Function) {
        lookup = options;
        options = {};
    }

    options = Object.assign({
        transparent: true,
        setPrototype: true,
        //override: false
    }, options);

    if (options.transparent) {

        //console.log("--- mixins.use proxy --- \r\n");

        // handle mixins transparent
        // use a proxy for property lookup
        return new Proxy(objs[0], {
            get: (target, prop, receiver) => {
                for (let obj of objs) {

                    // call lookup debug functions
                    // this helps to understand in which object 
                    // we currently looking for property <x>
                    lookup(prop, obj, objs);

                    // use: obj.hasOwnProperty(prop) ?
                    if (obj[prop] !== undefined) {

                        if (obj[prop] instanceof Function) {
                            return obj[prop].bind(obj);
                        } else {
                            return obj[prop];
                        }

                    }

                }
            }
        });

    } else {

        //console.log("--- mixins.create wrapper object  --- ");

        // handle mixisn as plain object
        // merge everything as once
        //let proto = Object.create(objs[0]);
        let wrapper = {};


        if (!options.setPrototype) {

            //console.log("--- mixins.create set prototpye  false! --- \r\n");

            wrapper = Object.assign({}, objs[0]);
        }

        // merge objects/properties into wrapper
        for (let obj of objs.slice(1, objs.length)) {
            Object.assign(wrapper, obj);
        };


        if (options.setPrototype) {
            //console.log("--- mixins.create set prototpye  true! --- \r\n");
            //console.log(Object.create(objs[0]))
            // why we must use this ?
            // Object.create should do the same?!
            // smale but big detail?: prot vs prototype in mdn description:
            // https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Object/create
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/setPrototypeOf
            Object.setPrototypeOf(wrapper, objs[0]);
        }

        return wrapper;

    }

};

module.exports = mixins;