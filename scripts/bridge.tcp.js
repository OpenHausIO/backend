#!/usr/bin/env node

const child_process = require("child_process");
const WebSocket = require("ws");
const request = require("../system/request");
const minimist = require("minimist");

const args = minimist(process.argv.slice(2), {
    string: ["device", "interface", "host", "port", "uplink"]
});



// http://127.0.0.1:8080/api/devices/6042785432c51e3e98e7acc0/interfaces/6042785432c51e3e98e7acc1

function bridge(ws, host, port) {

    // create stream from websocket
    const stream = WebSocket.createWebSocketStream(ws);

    /*
        ws.on("message", (message) => {
            console.log("Send to device", message)
        });
    */

    ws.on("close", () => {
        console.error("Disconnected from WebSocket: %s", ws.url);
        process.exit(0);
    });


    ws.on("open", () => {

        console.log(`Connected to WebSocket: "%s"`, ws.url);

        let nc = child_process.spawn("nc", [host, port]);


        nc.on("error", () => {
            console.log("netcat error")
        });

        nc.on("close", () => {
            console.log("netcat closed")
        });

        nc.on("spawn", () => {
            console.log("netcat spawend")
        })

        nc.stderr.pipe(process.stderr);

        stream.pipe(nc.stdin);
        nc.stdout.pipe(stream);


    });

}


setTimeout(() => {
    if (args.host && args.port && args.uplink) {


        const ws = new WebSocket(args.uplink);

        console.log(`Connecto to WebSocket URL: "%s"...`, ws.url);


        // bridge 
        bridge(ws, args.host, args.port);

    } else {

        if (!args.device || !args.interface) {
            console.error("Need to specify --device & --interface");
            process.exit();
        }

        request(`http://127.0.0.1:8080/api/devices/${args.device}/interfaces/${args.interface}`, (err, { status, body }) => {
            if (err) {

                console.error(err);
                process.exit();

            } else {


                const { host, port } = body.settings;


                const ws = new WebSocket(`http://127.0.0.1:8080/api/devices/${args.device}/interfaces/${args.interface}`);

                console.log(`Connecto to WebSocket URL: "%s"...`, ws.url);

                // bridge 
                bridge(ws, host, port);

            }
        });


    }
}, Number(args.delay || 1000));