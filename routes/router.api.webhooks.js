const C_WEBHOOKS = require("../components/webhooks");


module.exports = (app, router) => {

    router.param("_id", (req, res, next, _id) => {
        C_WEBHOOKS.get(_id, (err, obj) => {
            if (err) {

                res.status(400).json({
                    error: err
                });

            } else {

                if (!obj) {
                    return res.status(404).end();
                }

                req.item = obj;

                next();

            }
        });
    });

    router.all("/:_id/trigger", (req, res) => {

        //res.end(`Hello from webhook: ${req.method}, ${JSON.stringify(req.item)}`);

        req.item._trigger(req.body, req.query);

        res.status(202).end();

    });

};