const Cron = require("./class.cron.js");
const Job = require("./class.job.js");

/**
 * @description
 * This describes the component staff in the system folder.<br />
 * Every component depends on this classes and inherits all properties/methods.
 * 
 * The `index.js` file is just a shortcut to the class files:
 * 
 * 
 * @example
 * ```js
const Cron = require("./class.cron.js");
const Job = require("./class.job.js");

module.exports = {
    Cron,
    Job
};
 * ```
 */
module.exports = {
    Cron,
    Job
};

/*
const cron = new Cron();

cron.add("* * * * *", () => {
    console.log('cron job 1 just ran - every minute');
});


// *2 = *\/2 = \/ = /
cron.add("*2 * * * *", () => {
    console.log('cron job 1.5 just ran - every 2 minute');
});

cron.add("5 * * * *", () => {
    console.log('cron job 2 just ran - every hour on minute 5')
});

cron.add("15 * * * *", () => {
    console.log('cron job 3 just ran')
});

cron.add("30 * * * *", () => {
    console.log('cron job 4 just ran')
});

cron.start();

// Cron already running, but we can add more jobs, no problem
cron.add("0 * * * *", () => {
    console.log('cron job 5 just ran')
});

cron.add("7 9 * * 1,2,3,4,5", () => {
    console.log('at 9:07 of every morning from sunday to thursday')
});


let i = cron.add("* * * * *", () => {
    console.log("Manuall created job: * * * * *")
});


console.log(cron.jobs.length, i);

setTimeout(() => {
    console.log("Remove: Manuall created job");
    cron.remove(i);
    cron.remove(0);
}, 1000 * 60 * 3);
*/