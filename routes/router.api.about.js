//const ENVIRONMENT = require("./system/environments.js");
const os = require("os");
const v8 = require("v8");
const process = require("process");

/*
function calcCPUPrecentage() {

    var cpus = os.cpus();

    for (var i = 0, len = cpus.length; i < len; i++) {
        console.log("CPU %s:", i);
        var cpu = cpus[i], total = 0;

        for (var type in cpu.times) {
            total += cpu.times[type];
        }

        for (type in cpu.times) {
            console.log("\t", type, Math.round(100 * cpu.times[type] / total));
        }
    }

}
*/

module.exports = (app, router) => {

    // http route handler
    router.get("/", (req, res) => {

        res.json({
            environment: {
                NODE_ENV: process.env.NODE_ENV,
                HTTP_PORT: process.env.HTTP_PORT
            },
            heap: v8.getHeapStatistics(),
            cpu: {
                cores: os.cpus(),
                //usage: calcCPUPrecentage()
            },
            ram: {
                free: os.freemem(),
                total: os.totalmem()
            },
            usage: process.resourceUsage()
        });

    });

};