const timeout = require("../helper/timeout");

module.exports = (app, router) => {

    router.post("/:_id/execute", (req, res) => {


        let final = timeout(100, (timedout, duration, [err]) => {
            if (err) {

                res.status(406).end(err);

            } else {

                if (timedout) {

                    // its not sure how long a scenes is running
                    // and how/or its successful
                    res.status(202).end();

                } else {

                    // scene has executed within timeout
                    // therefore it was successful
                    res.status(200).end();

                }
            }
        });

        req.item.start().then(() => {
            final(null);
        }).catch((err) => {
            final(err);
        });

    });

};