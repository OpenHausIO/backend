const url = require("url");


function perform(uri, options, cb) {

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
                body = JSON.parse(body);
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


    if (options.callEnd) {
        request.end(options.body);
    }
    //request.write(options.body + "\r\n");

    return request;

}


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
        options = {};
    }

    if (!cb) {
        cb = () => { };
    }

    options = Object.assign({
        method: "GET",
        body: "",
        followRedirects: true,
        callEnd: true,
    }, options);


    return perform(uri, options, (err, result) => {
        if (err) {

            cb(err);

        } else {

            if (options.followRedirects && result.status >= 300 && result.status < 400) {

                perform(result.headers.location, options, cb);

            } else {

                cb(null, result);

            }

        }
    });

};