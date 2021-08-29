const url = require("url");

/**
 * 
 * @param {string} uri 
 * @param {options} options 
 * @param {function} cb 
 * @returns 
 */
module.exports = function request(uri, options, cb) {

    if (!cb && options instanceof Function) {
        cb = options;
        options = {}
    }

    options = Object.assign({
        method: "GET",
        body: ""
    }, options);


    let { protocol } = new url.URL(uri);

    if (!["http:", "https:"].includes(protocol)) {
        throw new Error(`Unspported protocol "${protocol.slice(0, -1)}`);
    }


    let request = require(protocol.slice(0, -1)).request(uri, options, (res) => {

        let chunks = [];

        res.on("data", (chunk) => {
            chunks.push(chunk);
        });

        res.on("error", cb);

        res.on("end", () => {

            let body = Buffer.concat(chunks);

            if (res.headers["content-type"] && res.headers["content-type"].includes("application/json")) {
                body = JSON.parse(body)
            }

            cb(null, {
                headers: res.headers,
                status: res.statusCode,
                body
            });

        });

    });


    request.on("error", (err) => {
        cb(err);
    });

    request.end(options.body);
    //request.write(options.body + "\r\n");

    return request;

};