/**
 * @function promisfy
 * Promsify a callback function
 * 
 * @param {Function} worker Function to implement the logic
 * @param {Function} cb Optional provided callback
 * 
 * @returns {Promise} Callback function
 */
function promisfy(worker, cb) {

    let wrapper = new Promise((resolve, reject) => {
        worker((err, ...args) => {
            if (err) {
                reject(err);
            } else {

                if (args.length === 1 && !cb) {
                    resolve(args[0]);
                } else {
                    resolve(args);
                }

            }
        });
    });

    if (cb) {

        wrapper.then((args) => {
            cb(null, ...args);
        }).catch((err) => {
            cb(err);
        });

        //return undefined;

    } else {

        return wrapper;

    }

}

module.exports = promisfy;