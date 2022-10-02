module.exports = (app, router) => {

    router.get("/:_id/commands", (req, res) => {
        res.json(req.item.commands);
    });

    router.param("_iid", (req, res, next) => {

        let cmd = req.item.commands.find((cmd) => {
            return cmd._id === req.params._iid;
        });

        req.cmd = cmd;

        next();

    });

    router.get("/:_id/commands/:_iid", (req, res) => {
        if (req.cmd) {
            res.json(req.cmd);
        } else {
            res.status(404);
        }
    });

    router.post("/:_id/commands/:_iid", (req, res) => {
        if (req.cmd) {

            req.cmd.trigger(req.body, (success) => {

                res.json({
                    success
                });

            });

        } else {
            res.status(404);
        }
    });

};