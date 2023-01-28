/**
 * @function infinity
 * Self calling code with delay
 * Worker gets called, where a callback is passed.
 * If the callback is invoked, worker is called again.
 * 
 * @param {Function} worker Function that can call itself over and over
 * @param {Number} [delay=0] Delay before worker is self re-called
 */
function infinity(worker, delay = 0) {

    const loop = () => {
        worker(() => {
            setTimeout(loop, delay);
        });
    };

    loop();

}

module.exports = infinity;