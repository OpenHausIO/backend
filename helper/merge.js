/**
 * @function merge
 * Merge two objects with nested arrays without overriding the array.
 * It instead updates/merges the items based on its key.
 *  
 * @param {Object} dst Destination where the <src> object is merged into (object to update)
 * @param {Object} src Source to merge with <dst> object
 * 
 * @returns {Object} Merged object
 *
 * https://stackoverflow.com/a/74196112/5781499
 */
function merge(dst, src) {
    return Object.entries(src).reduce((res, [key, cur]) => {

        if (Array.isArray(cur)) {

            let sourceArray = dst[key] || [];

            res[key] = cur.map((valObj, index) => {

                // fix #295
                if (!(typeof valObj === "object")) {
                    return valObj;
                }

                // this is simply merging on index, but if you wanted a "smarter" merge, you could look up
                // the dst by a specific key with sourceArray.find(...)
                return merge(sourceArray[index] || {}, valObj);

            });

        } else if (typeof cur === "object" && cur !== null) {

            res[key] = merge(dst[key] || {}, cur);

        } else {

            res[key] = cur;

        }

        return res;

    }, dst);
}

module.exports = merge;