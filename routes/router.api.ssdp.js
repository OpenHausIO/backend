const WebSocket = require("ws");

const C_SSDP = require("../components/ssdp");

// forward ssdp messages via WebSocket
// socat UDP4-RECVFROM:1900,ip-add-membership=239.255.255.250:0.0.0.0,fork - | wscat --connect=ws://127.0.0.1:8080/api/ssdp

// mkfifo mypipe
// <mypipe socat UDP4-RECVFROM:1900,ip-add-membership=239.255.255.250:0.0.0.0,reuseaddr,fork - | wscat --connect=ws://127.0.0.1:8080/api/ssdp >mypipe

// something to read
// http://upnp.org/resources/documents/UPnP_UDA_tutorial_July2014.pdf

// The code below breaks sometimes with the socat bridging
// Error: unknown ssdp message type cache-control: max-age=100
// Seems like the line handling works not perfect

// simple ssdp monitor
// nc -ulvv 239.255.255.250 1900


async function parseMessage(msg) {

    let [header, body] = msg.split("\r\n\r\n");

    return {
        header,
        body
    };

}

async function parseHeader(header) {

    let lines = header.split("\r\n");
    let type = lines[0];
    let fields = {};

    if (type.endsWith("* HTTP/1.1")) {
        type = type.split(" ")[0];
    } else if (type === "HTTP/1.1 200 OK") {
        type = "SEARCH-RESPONSE";
    } else {
        console.log("Unknwon type");
    }

    type = type.toLowerCase();

    if (!["m-search", "notify", "search-response"].includes(type)) {
        console.log("UNKNOWN SSDP MESSAGE");
        throw new Error(`unknown ssdp message type ${type}`);
    }

    lines.slice(1).forEach((line) => {

        let [key, ...value] = line.split(":");

        let k = key.toLowerCase();
        let v = value.join(":").trim().replaceAll(`"`, "");

        fields[k] = v;

    });

    // delete empty key
    // (last line from socat)
    //delete fields[""];

    return {
        type,
        fields
    };

}

module.exports = (app, router) => {

    let wss = new WebSocket.Server({
        noServer: true
    });

    let interval = setInterval(() => {
        wss.clients.forEach((ws) => {

            if (!ws.isAlive) {
                ws.terminate();
                return;
            }

            ws.isAlive = false;
            ws.ping();

        });
    }, Number(process.env.API_WEBSOCKET_TIMEOUT));


    wss.on("close", () => {
        clearInterval(interval);
    });

    wss.on("connection", (ws) => {

        ws.isAlive = true;
        let chunks = [];

        ws.on("pong", () => {
            ws.isAlive = true;
        });

        ws.on("message", async (msg) => {

            let size = msg.length;
            let complete = (msg[size - 4] === 13, msg[size - 3] === 10) && (msg[size - 2] === 13, msg[size - 1] === 10);

            // Note / thoughts about future implementations
            //
            // Header = standard SSDP message
            // Body = header location content as json
            //
            // The connector could do a http request to the location field in the message/header
            // prase the returned xml, convert it to json and send it in the "message" as body
            // With this, the server must not perform any http requests (which could be a mess without any device interface set)
            // And the socat/wscat magic above would still work for normal discovering
            // 
            // <or> would it be better to move the parsing part into the connector and send just json data?
            // that breaks the socat/wscat stuff


            // i feel like this is a silly check and something more accurat should do the job
            // msg === "\r\n" && chunks[chunks.length - 1].slice(-1) === "\r\n"
            if (msg == "" || complete) {

                if (chunks.length > 0 && !complete) {
                    msg = Buffer.concat(chunks.map((str) => {
                        return Buffer.from(str + "\r\n");
                    }));
                }

                let { header, body } = await parseMessage(msg.toString());
                let { fields, type } = await parseHeader(header);

                // emit ssdp message
                C_SSDP.events.emit("message", type, fields, body);

                // clear array
                chunks = [];

            } else {
                chunks.push(msg);
            }
        });

    });

    router.get("/", (req, res, next) => {
        if ((!req.headers["upgrade"] || !req.headers["connection"])) {

            // no websocket handshake
            // output iface as json
            // let do that the rest handler

            // forward to rest-handler.js
            next();

        } else {

            wss.handleUpgrade(req, req.socket, req.headers, (ws) => {
                wss.emit("connection", ws, req);
            });

        }
    });

};