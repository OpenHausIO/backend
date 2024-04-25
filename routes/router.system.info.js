const process = require("process");
const { exec } = require("child_process");
const os = require("os");
//const mongodb = require("mongodb");

module.exports = (router) => {

    router.get("/", (req, res) => {
        Promise.all([

            // get npm version
            new Promise((resolve, reject) => {
                exec("npm -v", (err, stdout, stderr) => {
                    if (err || stderr) {

                        reject(err || stderr);

                    } else {

                        resolve(stdout);

                    }
                });
            }),

            // get tar version
            // TODO: use explicit path to binary
            // see: https://github.com/OpenHausIO/backend/issues/432 "Add config for bin pathes"
            new Promise((resolve, reject) => {
                exec("tar --version", (err, stdout, stderr) => {
                    if (err || stderr) {

                        reject(err || stdout);

                    } else {

                        // extract version number from output
                        // `tar (GNU tar) 1.34`
                        let matches = stdout.match(/(\d+\.\d+)/);
                        resolve(matches && matches[0] || "undefined");

                    }
                });
            }),

            // get mongodb version
            // TODO: before enable this, check if this works with authentication
            /*
            new Promise((resolve, reject) => {

                let db = mongodb.client.admin();

                db.serverStatus((err, info) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(info.version);
                    }
                });

            }),
            */

            // calculate cpu usage
            new Promise((resolve, reject) => {
                try {

                    const perc = os.cpus().map(cpu => cpu.times).reduce((acc, times) => {
                        const totalCPUTime = Object.values(times).reduce((total, time) => total + time, 0);
                        const idleCPUTime = times.idle;
                        const cpuUsagePercentage = ((totalCPUTime - idleCPUTime) / totalCPUTime) * 100;
                        return acc + cpuUsagePercentage;
                    }, 0) / os.cpus().length;

                    resolve(perc.toFixed(2));

                } catch (err) {
                    reject(err);
                }
            }),

            // calculate ram usage
            new Promise((resolve, reject) => {
                try {

                    let totalMemory = os.totalmem();
                    let usedMemory = totalMemory - os.freemem();
                    let perc = (usedMemory / totalMemory) * 100;

                    process.nextTick(() => {
                        resolve(perc.toFixed(2));
                    });

                } catch (err) {
                    reject(err);
                }
            })

        ]).then((results) => {

            // remove whitespaces & convert to string
            let [npm, tar, /*mongodb,*/ cpu, ram] = results.map((result) => {
                return String(result).trim();
            });

            res.json({
                versions: {
                    node: process.versions.node,
                    npm,
                    tar,
                    //mongodb
                },
                // ore move this into a /usage route?
                usage: {
                    cpu,
                    ram
                }
            });

        }).catch((err) => {

            res.status(500).json({
                error: err
            });

        });
    });

};