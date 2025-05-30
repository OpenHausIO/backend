#!/usr/bin/env node

const child_process = require("child_process");
const request = require("../system/request");
const minimist = require("minimist");

const args = minimist(process.argv.slice(2), {
    string: ["host", "help"],
    number: ["delay"]
});


if (!args.host) {
    args.host = "127.0.0.1";
}

if (!args.port) {
    args.port = "8080";
}

if (!args.url) {
    args.url = `http://${args.host}:${args.port}`;
}

if (!args.delay) {
    args.delay = 5;
}

if ("help" in args) {

    console.log("OpenHaus interface/bridge connector\r\n");
    console.log(`--host\t\tHostname, default "127.0.0.1"`);
    console.log(`--port\t\tPort, default "8080"`);
    console.log(`--url\t\tFull server url (inkl. proto), default "http://127.0.0.1"`);
    console.log(`--delay\t\tConnection delay in sec, before start bridging to WebSocket, default "5"`);

    process.exit(0);

}

const BRIDGES_PROCCESSES = new Set();
const DEVICE_INTERFACES = new Map();

setTimeout(() => {
    request(`${args.url}/api/devices`, (err, { status, body }) => {
        if (err) {

            console.error(err);
            process.exit();

        } else {

            if (status !== 200) {
                console.error(`Invalid http status code (${status}) returned`);
                process.exit();
            }

            body.forEach((device) => {

                if (!DEVICE_INTERFACES.has(device._id)) {
                    DEVICE_INTERFACES.set(device._id, new Set());
                }

                let set = DEVICE_INTERFACES.get(device._id);

                set.add(device.interfaces);

            });

            console.log(DEVICE_INTERFACES);

            DEVICE_INTERFACES.forEach((interfaces, device) => {
                interfaces.forEach((ifaces) => {
                    ifaces.forEach((iface) => {


                        let cp = child_process.spawn("node", [`bridge.${iface.transport}.js`, `--interface=${iface._id}`, `--device=${device}`]);


                        cp.stderr.on("data", (chunk) => {
                            console.log(`stdout [${device}/${iface._id}] > `, chunk.toString());
                        });

                        cp.on("spawn", () => {
                            console.log(`Bridge [${device}/${iface._id}] is online `);
                        });

                        cp.on("exit", (code) => {
                            console.log(`[${device}/${iface._id}] Exited `, code);
                        });

                        BRIDGES_PROCCESSES.add(cp);

                    });
                });
            });

        }
    });
}, Number(args.delay * 1000 || 1000));