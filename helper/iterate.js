/**
 * @function iterate
 * Iterate over each (child) item and preserves object structure
 * 
 * @param {*} data Anything you want to iterate over its items
 * @param {function} cb function that is called for/on each item
 * 
 * @returns input data (may be modified by callback function)
 * 
 * @example
 * ```js
 * const _iterate = require(".../helper/iterate.js");
const input = JSON.stringify({
    data: true,
    timestamp: Date.now(),
    array: [1, 2, 3],
    obj: {
        cool: "Nice ;)",
        nested: [null, undefined, true, false, 0, 1]
    },
    buffer: Buffer.from("Hello World")
});

const output = JSON.parse(input);

console.log(output.buffer)

const modified = _iterate(output, (key, value, type, parent) => {

    //console.log(`${key} = ${value}; ${type},; parent = ${parent}`)

    // unit tests?
    //console.log(value === parent[key]);

    // Convert serialized buffer
    if (type === "object", value.hasOwnProperty("type") && value.hasOwnProperty("data") && value.type === "Buffer") {
        return Buffer.from(value.data);
    }


    return value;

});

console.log(modified)
 * ```
 */
function iterate(data, cb) {

    // cb(key, value, type, parent)


    // https://stackoverflow.com/a/53106917/5781499

    for (let key in data) {
        if (data[key] instanceof Buffer) {

            // handle buffer seperate
            data[key] = cb(key, data[key], "buffer", data);

        } else if (data[key] instanceof Array) {

            // handle array before objects
            // [] instanceof Object = true

            data[key] = cb(key, data[key], "array", data);

            // iterrate over array
            // recurisv call with array entry/item
            data[key] = data[key].map((entry) => {
                return iterate(entry, cb);
            });

        } else if (data[key] instanceof Object) {

            // call cb on before we iterate over each child
            data[key] = cb(key, data[key], "object", data);

            // iterrate over data object
            // recursiv call with object
            data[key] = iterate(data[key], cb);

        } else {

            // single property reached
            // call callback with property type
            data[key] = cb(key, data[key], typeof data[key], data);

        }
    }

    return data;

}


module.exports = iterate;