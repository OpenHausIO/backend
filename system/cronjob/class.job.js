/**
 * @description
 * Job that represents a cronjob job. <br />
 * Note: Non-standard predefined scheduling definitions, like `@weekly`, are not supported!
 * 
 * @class Job
 * 
 * @param {String} cron String that reprentes when the job should be run
 * @param {Function} fnc Callback function to execute, gets called when its time to run job
 *
 * @property {Array} minute
 * @property {Array} hour
 * @property {Array} date
 * @property {Array} month
 * @property {Array} day
 * @property {Function} fnc Callback that gets called when its time to run job
 * 
 * @link https://en.wikipedia.org/wiki/Cron#Overview
 * @link https://crontab.guru/
 */
module.exports = class Job {

    constructor(cron, fnc) {

        // TODO (mstirner) fix eslint rule
        // eslint-disable-next-line no-useless-escape
        let parts = cron.match(/^([0-9,\-\/]+|\*{1}|\*{1}\/[0-9]+)\s+([0-9,\-\/]+|\*{1}|\*{1}\/[0-9]+)\s+([0-9,\-\/]+|\*{1}|\*{1}\/[0-9]+)\s+([0-9,\-\/]+|\*{1}|\*{1}\/[0-9]+)\s+([0-9,\-\/]+|\*{1}|\*{1}\/[0-9]+)\s*$/);

        this.minute = this.parse(parts[1]);
        this.hour = this.parse(parts[2]);
        this.date = this.parse(parts[3]);
        this.month = this.parse(parts[4]);
        this.day = this.parse(parts[5]);

        this.fnc = fnc;

    }

    /**
     * @function parse
     * Parse a time expression
     * 
     * @param {String} a 
     * 
     * @returns {Array}
     */
    parse(a) {
        return a.split(",").map((i) => {

            let z = i.split("/");
            let x = z[0].split("-");

            if (x[0] == "*") {
                x[0] = -1;
            }

            if (x.length == 1) {
                x.push(x[0]);
            }

            x[2] = z.length === 1 ? -1 : z[1];
            // parsed array structure:
            x[0] = parseInt(x[0]); // 0 - from
            x[1] = parseInt(x[1]); // 1 - to
            x[2] = parseInt(x[2]); // 2 modulus 

            return x;

        });
    }

};