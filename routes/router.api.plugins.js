const path = require("path");
const { pipeline } = require("stream");
const { exec } = require("child_process");

module.exports = (app, router) => {

    router.put("/:_id/files", (req, res) => {

        let p = path.resolve(process.cwd(), "plugins", req.item.uuid);
        let tar = exec(`tar zxf - -C ${p}`);

        pipeline(req, tar.stdin, (err) => {
            if (err) {

                res.status(500).end();

            } else {

                res.json(req.item);

            }
        });

    });

};