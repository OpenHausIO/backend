/**
 * Self calling code with delay
 * Worker gets called, where a callback is passed.
 * If the callback is invoked, worker is called again.
 * @param {function} worker Function that can call itself over and over
 * @param {number} delay Delay before worker is self re-called
 */
function infinity(worker, delay = 3000) {

    const loop = () => {
        worker(() => {
            setTimeout(loop, delay);
        });
    };

    loop();

}

module.exports = infinity;