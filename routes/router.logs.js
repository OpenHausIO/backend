const fs = require("fs");
const readline = require("readline");

module.exports = (app, router) => {
    router.get("/", (req, res) => {
        if ((!req.headers["upgrade"] || !req.headers["connection"])) {

            let {
                limit = 100,
                offset = 0
            } = req.query;

            let output = [];
            let lines = 0;
            let stream = fs.createReadStream(`${process.env.LOG_PATH}/combined.log`);

            let rl = readline.createInterface({
                input: stream
            });

            rl.on("line", (line) => {

                // count lines
                lines += 1;

                if (output.length >= limit) {
                    rl.close();
                    return;
                }

                if (offset <= lines) {
                    output.push(JSON.parse(line));
                }

            });

            rl.on("close", () => {
                res.json(output);
            });

        } else {

            // handle websocket
            // TODO implement websocket stream
            // watch for changes in combined logfile and send events over ws
            res.status(501).end();

        }
    });
};