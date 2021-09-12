#!/usr/bin/env node

const WebSocket = require("ws");
const request = require("../system/request");
const minimist = require("minimist");

const args = minimist(process.argv.slice(2), {
    string: ["device", "interface"]
});


if (!args.device || !args.interface) {
    console.error("Need to specify --device & --interface");
    process.exit();
}


// ./client.ws.js --interface=6042785432c51e3e98e7acc2 --device=6042785432c51e3e98e7acc0

setTimeout(() => {
    request(`http://127.0.0.1:8080/api/devices/${args.device}/interfaces/${args.interface}`, (err, { status, body }) => {
        if (err) {

            console.error(err);
            process.exit();

        } else {

            console.log(status, body);

            const { host, port } = body.settings;


            const ws = new WebSocket(`http://127.0.0.1:8080/api/devices/${args.device}/interfaces/${args.interface}`);

            console.log(`Connecto to WebSocket URL: "%s"...`, ws.url);


            ws.on("open", () => {

                console.log(`Connected to WebSocket: "%s"`, ws.url);



                //let nc = child_process.spawn("nc", [host, port]);

                let dev = new WebSocket(`ws://${host}:${port}`);
                let nc = WebSocket.createWebSocketStream(dev);
                let stream = WebSocket.createWebSocketStream(ws);

                dev.on("open", () => {
                    console.log("Connected to WebSocket (dev");
                });


                dev.on("error", () => {
                    console.log("netcat error");
                });



                stream.pipe(nc);
                nc.pipe(stream);


            });

            ws.on("close", () => {
                console.error("Disconnected from WebSocket: %s", ws.url);
                process.exit(1000);
            });

        }
    });
}, Number(args.delay || 1000));