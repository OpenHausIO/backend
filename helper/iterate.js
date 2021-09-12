/**
 * Iterate over each (child) item and preserves object structure
 * @param {*} data Anything you want to iterate over its items
 * @param {function} cb function that is called for/on each item
 * @returns input data (may be modified by callback function)
 */
function iterate(data, cb) {

    // NOTE check if thing is iterable?
    // https://stackoverflow.com/a/53106917/5781499

    for (let key in data) {
        if (data[key] instanceof Object) {

            // call cb on before we iterate over each child
            data[key] = cb(data[key], typeof data[key], key);

            // iterrate over data object
            // recursiv call with object
            data[key] = iterate(data[key], cb);

        } else if (data[key] instanceof Array) {

            // call cb on before we iterate over each child
            data[key] = cb(data[key], typeof data[key], key);

            // iterrate over array
            // recurisv call with array entry/item
            data[key] = data[key].map((entry) => {
                return iterate(entry, cb);
            });

        } else {

            // single property reached
            // call callback with property type
            data[key] = cb(data[key], typeof data[key], key);

        }
    }

    return data;

}


module.exports = iterate;