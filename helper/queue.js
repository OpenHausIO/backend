/**
 * 
 * @param {number} counter 
 * @param {function} cb 
 * @returns 
 */
function queue(counter = 0, cb = () => { }) {

    let fired = false;

    return function () {

        // decrement
        counter -= 1;

        if (counter <= 0 && !fired) {
            fired = true;
            cb();
        }

    };

};

module.exports = queue;