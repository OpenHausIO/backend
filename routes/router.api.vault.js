module.exports = (app, router) => {

    router.get("/:_id/secrets", (req, res) => {
        // NOTE: return lean?
        res.json(req.item.secrets);
    });

    router.param("_sid", (req, res, next) => {

        req.secret = req.item.secrets.find((secret) => {
            return secret._id === req.params._sid;
        });

        if (!req.secret) {
            return res.status(404);
        }

        next();

    });

    router.post("/:_id/secrets/:_sid/encrypt", (req, res) => {
        try {

            if (Object.hasOwnProperty.call(req.body, "value")) {
                req.secret.encrypt(req.body.value);
            }

            res.json(req.secret);

        } catch (err) {

            res.status(422).json({
                error: err.message
            });

        }
    });

    router.post("/:_id/secrets/:_sid/decrypt", (req, res) => {
        try {

            res.json({
                value: req.secret.decrypt()
            });

        } catch (err) {

            res.status(422).json({
                error: err.message
            });

        }
    });

};