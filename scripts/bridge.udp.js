#!/usr/bin/env node

const dgram = require("dgram");
const WebSocket = require("ws");
const request = require("../system/request");
const minimist = require("minimist");

const args = minimist(process.argv.slice(2), {
    string: ["device", "interface"],
    boolean: ["multicast", "broadcast", "ssdp"]
});


if (!args.device || !args.interface) {
    console.error("Need to specify --device & --interface");
    process.exit();
}




setTimeout(() => {

    let socket = dgram.createSocket("udp4");
    socket.bind();


    if (args.broadcast || args.multicast) {

        socket.setBroadcast(true);
        socket.setMulticastTTL(128);
        socket.addMembership(args.destination);

    }


    if (args.ssdp) {

        const ws = new WebSocket(`http://127.0.0.1:8080/api/ssdp`);

        ws.on("open", () => {
            console.log(`Connected to WebSocket: "%s"`, ws.url);
        });

        ws.on("message", (data) => {

            let message = Buffer.from(data);
            socket.send(message, 0, message.length, args.port, args.desitnation);

        });

        socket.on("message", (message) => {
            ws.send(message);
        });


        ws.on("close", () => {
            console.error("Disconnected from WebSocket: %s", ws.url);
            process.exit(1000);
        });

    } else if (args.interface && args.device) {


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
                });


                ws.on("message", (data) => {

                    let message = Buffer.from(data);
                    socket.send(message, 0, message.length, port, host);

                });

                socket.on("message", (message) => {
                    ws.send(message);
                });


                ws.on("close", () => {
                    console.error("Disconnected from WebSocket: %s", ws.url);
                    process.exit(1000);
                });

            }
        });

    }


}, Number(args.delay || 1000));