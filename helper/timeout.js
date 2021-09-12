/**
 * Wait n ms befor execute the callback function
 * @param {Number} time Time in ms to wait before calling the callback function
 * @param {function} cb Callback function
 * @returns {function} Function to call before timeout is reached/triggerd
 */
function timeout(time, cb) {

    let called = false;
    let start = Date.now();

    let timer = setTimeout(() => {
        if (!called) {

            called = true;
            cb(true, Date.now() - start, []);

        }
    }, time);


    return (...args) => {

        clearTimeout(timer);
        timer = null;

        if (!called) {

            called = true;
            cb(false, Date.now() - start, [...args]);

        }

    };

}

module.exports = timeout;