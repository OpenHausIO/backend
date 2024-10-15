module.exports = (app, router) => {

    router.post("/:_id/trigger", (req, res) => {
        req.item.trigger();
        res.status(202).json(req.item);
    });

    router.post("/:_id/abort", (req, res) => {
        req.item.abort();
        res.json(req.item);
    });

    router.get("/:_id/state", ({ item: {
        running,
        aborted,
        index,
        finished,
        timestamps
    } }, res) => {
        res.json({
            running,
            aborted,
            finished,
            index,
            timestamps
        });
    });

};