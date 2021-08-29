module.exports = (app, router) => {

    router.get("/:_id/commands", (req, res) => {
        res.json(req.item.commands);
    });

    router.get("/:_id/commands/:_iid", (req, res) => {

        let cmd = req.item.commands.find((cmd) => {
            return cmd._id === req.params._iid;
        });

        if (cmd) {
            res.json(cmd);
        } else {
            res.status(404);
        }


    });

    router.post("/:_id/commands/:_iid", (req, res) => {
        req.item.commands.execute(req.params["_iid"], req.body, (err, success) => {
            if (err) {

                res.status(900).json({
                    success: success || false,
                    error: err.toString()
                });

            } else {

                res.json({
                    success
                });

            }
        });
    });

};