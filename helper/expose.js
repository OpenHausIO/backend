/**
 * @function
 * Expose a function/method on a array object
 * 
 * @param {Array} arr 
 * @param {String} method 
 * @param {String} key 
 * 
 * @returns Wrapped method that accepts as first argument a _id
 * 
 * @example
 * 
 * class Item {
 *
 *  constructor(obj) {
 *      Object.assign(this, obj);
 *  }
 *
 *  fnc1() {
 *       console.log("fnc1 called", this);
 *       return "Yeah!";
 *   }
 *
 *  fnc2() {
 *      console.log("fnc2 called");
 *      return new Promise((resolve) => {
 *
 *          setTimeout(() => {
 *               resolve(Date.now())
 *          }, 1000);
 *
 *      });
 *  }
 *
 *  fnc3(cb) {
 *      console.log("fnc3 called");
 *      //setTimeout(cb, 1000);
 *      //return cb();
 *      //return null;
 *  }
 *
 * }
 *
 * const arr = new Array(3).fill(0).map((item, index) => {
 *   return new Item({
 *       _id: index,
 *      foo: {
 *          bar: "baz"
 *      }
 *   });
 * });
 * 
 * 
 * const fnc1 = _export(arr, "fnc1");
 * const fnc2 = _export(arr, "fnc2");
 * const fnc3 = _export(arr, "fnc3");
 * 
 * console.log(arr, fnc1(1, { data: true }));
 * console.log(fnc2(2))
 * console.log(fnc3(0, () => { return "foo" }));
 * console.log(fnc1, fnc2, fnc3)
 * 
 */
function expose(arr, method, key = "_id") {
    return (_id, ...args) => {

        let target = arr.find((obj) => {
            return obj[key] === _id;
        });

        if (!target) {
            throw new Error(`Item with ${key} "${_id}" not found`);
        }

        if (!(target[method] instanceof Function)) {
            throw new TypeError(`"${method}" is not a function on target "${_id}"`);
        }

        // Pass everything to the function & return everyhting
        // including undefined & promises
        return target[method].apply(target, args);

    };
}

module.exports = expose;