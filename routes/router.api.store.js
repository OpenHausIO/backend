module.exports = (app, router) => {

    router.param("_cid", (req, res, next) => {

        req.config = req.item.config.find((config) => {
            return config._id === req.params._cid;
        });

        if (!req.config) {
            return res.status(404);
        }

        next();

    });

    router.get("/:_id/config", (req, res) => {
        res.json(req.item.config);
    });

    router.get("/:_id/config/:_cid", (req, res) => {
        res.json(req.config);
    });

    router.post("/:_id/config/:_cid", (req, res) => {
        try {

            if (Object.hasOwnProperty.call(req.body, "value")) {
                req.config.value = req.body.value;
            }

            res.json(req.config);

        } catch (err) {

            res.status(422).json({
                error: err.message
            });

        }
    });

};