const C_WEBHOOKS = require("../components/webhooks");
const C_SCENES = require("../components/scenes");

module.exports = (app, router) => {

    // NOTE: Why is this needed?
    // if _id is found, `req.item` should be allready set
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

        let trigger = C_SCENES.items.map(({ triggers }) => {
            return triggers;
        }).flat().find(({ type, params }) => {

            let found = 1;

            found &= type === "webhook";
            found &= params?._id === req.params._id;
            found &= req.item._handler.length === 0;

            return found;

        });

        if (trigger) {
            trigger.fire();
        } else {
            req.item._trigger(req.body, req.query, req);
        }

        res.status(202).end();

    });

};