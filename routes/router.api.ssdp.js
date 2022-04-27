const WebSocket = require("ws");

const C_SSDP = require("../components/ssdp");

// forward ssdp messages via WebSocket
// socat UDP4-RECVFROM:1900,ip-add-membership=239.255.255.250:0.0.0.0,fork - | wscat --connect=ws://127.0.0.1:8080/api/ssdp

// mkfifo mypipe
// <mypipe socat UDP4-RECVFROM:1900,ip-add-membership=239.255.255.250:0.0.0.0,reuseaddr,fork - | wscat --connect=ws://127.0.0.1:8080/api/ssdp >mypipe

// something to read
// http://upnp.org/resources/documents/UPnP_UDA_tutorial_July2014.pdf

module.exports = (app, router) => {

    let wss = new WebSocket.Server({
        noServer: true
    });

    wss.on("connection", (ws) => {

        let chunks = [];

        ws.on("message", (msg) => {

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

            // NOTE For better parsing for the message, utilize the helper/request.js file?
            // Create for earch connection/message a request
            // Implement a readable use that as socket, if request is done, create from start.

            // i feel like this is a silly check and something more accurat should do the job
            // msg === "\r\n" && chunks[chunks.length - 1].slice(-1) === "\r\n"
            if (msg == "") {

                let headers = {};
                let type = chunks[0];

                if (type.endsWith("* HTTP/1.1")) {
                    type = type.split(" ")[0];
                } else if (type === "HTTP/1.1 200 OK") {
                    type = "SEARCH-RESPONSE";
                } else {
                    console.log("Unknwon type");
                }

                // store head key/value pair in object
                chunks.slice(1).forEach((line) => {

                    let [key, ...value] = line.split(":");

                    let k = key.toLowerCase();
                    let v = value.join(":").trim().replaceAll(`"`, "");

                    headers[k] = v;

                });

                // for better handling, convert to lowercase
                type = type.toLowerCase();

                // clear chunks
                chunks = [];

                if (!["m-search", "notify", "search-response"].includes(type)) {
                    console.log("UNKNOWN SSDP MESSAGE");
                    throw new Error(`unknown ssdp message type ${type}`);
                }

                // emit ssdp message
                C_SSDP.events.emit("message", type, headers);

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