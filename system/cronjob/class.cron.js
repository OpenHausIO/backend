const Job = require("./class.job.js");

module.exports = class Cron {

    // based on https://gist.github.com/shimondoodkin/1926749

    /**
     * @class Cron
     * @description
     * 
     * @param {Boolean} [autostart=true] Start automaticly processing jobs
     * 
     * @property {Array} jobs
     * @property {Number|null} timer
     * @property {Number} interval
     * @property {Boolean} autostart
     */
    constructor(autostart = true) {

        this.jobs = [];
        this.timer = null;
        this.interval = 60 * 1000;
        this.autostart = autostart;

        if (this.autostart) {
            this.start();
        }

    }


    /**
     * @function match 
     * Checks if time/date matches with job
     * 
     * @param {String} a 
     * @param {String} b 
     * 
     * @returns {Boolean}
     */
    match(a, b) {

        for (let c, b0, i = 0; i < a.length; i++) {

            c = a[i];

            if (c[0] === -1 || (b >= c[0] && b <= c[1])) {

                b0 = b - c[0];

                if (c[2] === -1 || b0 === 0 || b0 % c[2] === 0) {
                    return true;
                }

            }

        }

        return false;

    }


    /**
     * @function process 
     * Procces jobs
     * 
     * @internal
     */
    process() {

        let now = new Date();

        this.jobs.forEach(({ minute, hour, date, month, day, fnc }) => {

            let run = 1;

            run &= this.match(minute, now.getMinutes());
            run &= this.match(hour, now.getHours());
            run &= this.match(date, now.getDate());
            run &= this.match(month, now.getMonth());
            run &= this.match(day, now.getDay());

            if (run) {
                fnc();
            }

        });

    }


    /**
     * @function add 
     * Add new job
     * 
     * @param {String} cron Time declaration
     * @param {Function} fnc Function to exectute
     * 
     * @returns {Number} Index of the job in the jobs array
     */
    add(cron, fnc) {
        return this.jobs.push(new Job(cron, fnc)) - 1;
    }


    /**
     * @function remove 
     * Removes a job from being executed
     * 
     * @param {Number} i Index of the job
     * 
     * @returns {Object} The removed job object
     */
    remove(i) {
        return this.jobs.splice(i, 1)[0];
    }


    /**
     * @function start 
     * Start executing jobs
     */
    start() {
        if (!this.timer) {
            this.timer = setInterval(() => {
                console.log();
                this.process();
            }, this.interval);
        }
    }


    /**
     * @function stop 
     * Stop executing jobs
     */
    stop() {
        clearInterval(this.timer);
        this.timer = null;
    }


}; 