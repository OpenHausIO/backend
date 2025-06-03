module.exports = (app, router) => {

    router.get("/:_id/commands", (req, res) => {
        res.json(req.item.commands);
    });

    router.get("/:_id/states", (req, res) => {
        res.json(req.item.states);
    });

    router.param("_cid", (req, res, next) => {

        req.cmd = req.item.commands.find((cmd) => {
            return cmd._id === req.params._cid;
        });

        next();

    });

    router.param("_sid", (req, res, next) => {

        req.state = req.item.states.find((cmd) => {
            return cmd._id === req.params._sid;
        });

        next();

    });

    router.get("/:_id/commands/:_cid", (req, res) => {
        if (req.cmd) {
            res.json(req.cmd);
        } else {
            res.status(404).end();
        }
    });

    router.post("/:_id/commands/:_cid", (req, res) => {
        if (req.cmd) {

            req.cmd.trigger(req.body, (err, success) => {
                if (err) {
                    if (err.code === "NO_INTERFACE") {

                        res.status(424).json({
                            error: err.message
                        });

                    } else if (err.code === "NO_HANDLER") {

                        res.status(425).json({
                            error: err.message,
                            stack: err.stack
                        });

                    } else {

                        res.status(500).json({
                            error: err.message,
                            stack: err.stack
                        });

                    }
                } else {

                    res.json({
                        success
                    });

                }
            });

        } else {
            res.status(404).end();
        }
    });

    router.get("/:_id/states/:_sid", (req, res) => {
        if (req.state) {
            res.json(req.state);
        } else {
            res.status(404).end();
        }
    });

    router.post("/:_id/states/:_sid", (req, res) => {
        if (req.state) {
            try {

                if (Object.hasOwnProperty.call(req.body, "value")) {
                    req.state.value = req.body.value;
                } else {
                    req.state.value = null;
                }

                res.json(req.state);

            } catch (err) {

                res.status(422).json({
                    error: err.message
                });

            }
        } else {
            res.status(404).end();
        }
    });

};