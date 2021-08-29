#!/usr/bin/env node

const child_process = require("child_process");
const WebSocket = require("ws");
const request = require("../system/request");
const minimist = require("minimist");
const { interface_server } = require("../system/shared_objects");

const args = minimist(process.argv.slice(2), {
    string: ["host"]
});


if (!args.host) {
    args.host = "127.0.0.1:8080";
}

const BRIDGES_PROCCESSES = new Set();
const DEVICE_INTERFACES = new Map();

setTimeout(() => {
    request(`http://${args.host}/api/devices`, (err, { status, body }) => {
        if (err) {

            console.error(err);
            process.exit();

        } else {

            if (status !== 200) {
                console.error(`Invalid http status code (${status}) returned`);
                process.exit();
            }

            // create array only containing interfaces
            /*
            let interfaces = body.reduce((prev, cur) => {

                // cur = device object
                prev.push(cur.interfaces);

                return prev;

            }, []).flat();
            */

            body.forEach((device) => {

                if (!DEVICE_INTERFACES.has(device._id)) {
                    DEVICE_INTERFACES.set(device._id, new Set());
                }

                let set = DEVICE_INTERFACES.get(device._id);

                set.add(device.interfaces);

            });

            console.log(DEVICE_INTERFACES)

            DEVICE_INTERFACES.forEach((interfaces, device) => {
                interfaces.forEach((ifaces) => {
                    ifaces.forEach((iface) => {


                        let cp = child_process.spawn("node", [`bridge.${iface.transport}.js`, `--interface=${iface._id}`, `--device=${device}`]);

                        /*
                                                cp.stdout.on("data", (chunk) => {
                                                    console.log(`stdout [${device}/${iface._id}] > `, chunk.toString())
                                                });
                                                */

                        cp.stderr.on("data", (chunk) => {
                            console.log(`stdout [${device}/${iface._id}] > `, chunk.toString())
                        });

                        cp.on("spawn", () => {
                            console.log(`Bridge [${device}/${iface._id}] is online `)
                        });

                        cp.on("exit", (code) => {
                            console.log(`[${device}/${iface._id}] Exited `, code)
                        });

                        BRIDGES_PROCCESSES.add(cp);

                    });
                });
            });

        }
    });
}, Number(args.delay || 1000));