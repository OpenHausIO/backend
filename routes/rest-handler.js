module.exports = (C_COMPONENT, router) => {

    router.param("_id", (req, res, next, _id) => {
        C_COMPONENT.get(_id, (err, obj) => {
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

    router.get("/:_id?", (req, res) => {
        if (req.params["_id"] && req.item) {

            res.json(req.item);

        } else {

            let end = C_COMPONENT.items.length;
            let limit = Number(req.query.limit || end);
            let offset = Number(req.query.offset || 0);

            if (offset + limit < end) {
                end = offset + limit;
            }

            res.json(C_COMPONENT.items.slice(offset, end));

        }
    });

    router.patch("/:_id", (req, res) => {

        //console.log("Upate", req.item)

        if (!req.params["_id"]) {
            return res.status(400).end();
        }

        C_COMPONENT.update(req.params["_id"], req.body, (err, result) => {
            if (err) {

                console.log(err, result);

                res.status(400).json({
                    error: err
                });

            } else {

                res.json(result);

            }
        });

    });

    router.put("/", (req, res) => {
        C_COMPONENT.add(req.body, (err, result) => {
            if (err) {

                res.status(400).json({
                    error: err
                });

            } else {

                res.json(result);

            }
        });
    });

    router.delete("/:_id", (req, res) => {

        if (!req.params["_id"] || !req.item) {
            return res.status(404).end();
        }

        C_COMPONENT.remove(req.params["_id"], (err, result) => {
            if (err) {

                res.status(400).json({
                    error: err
                });

            } else {

                res.json(result);

            }
        });

    });

};