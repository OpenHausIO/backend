module.exports = (app, router) => {

    router.post("/:_id/trigger", (req, res) => {
        console.log("Trigger scene", req.item);
        req.item.trigger();
        res.status(202).end();
    });

    router.post("/:_id/abort", (req, res) => {
        console.log("Abort scene", req.item);
        req.item.abort();
        res.end();
    });

    router.get("/:_id/state", ({ item: {
        running,
        aborted,
        index,
        finished
    } }, res) => {
        res.json({
            running,
            aborted,
            finished,
            index
        });
    });

};