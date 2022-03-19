/**
 * 
 * @param {number} counter 
 * @param {function} cb 
 * @returns 
 */
function queue(counter = 0, cb = () => { }) {

    let fired = false;

    return function (...args) {

        // decrement
        counter -= 1;

        if (counter <= 0 && !fired) {
            fired = true;
            cb(...args);
        }

    };

}

module.exports = queue;