const _iterate = require("../helper/iterate.js");

module.exports = (C_COMPONENT, router) => {

    const { logger } = C_COMPONENT;

    router.use((req, res, next) => {

        let json = res.json;

        // convert string true to real boolean
        req.options = _iterate(req.query?.options || {}, (key, value) => {
            return value == "true";
        });

        // censor password key
        // no password should ever be sent to the client
        res.json = function (obj) {

            // use this when node >= 17
            //obj = structuredClone(obj);
            // fix #279
            obj = JSON.parse(JSON.stringify(obj));

            obj = _iterate(obj, (key, value) => {

                // remove password key if present
                // this must be first
                if (key === "password") {
                    return null;
                }

                return value;

            });

            json.call(this, obj);

        };

        next();

    });

    router.use((req, res, next) => {
        if (req.body) {

            req.body = _iterate(req.body, (key, value, type) => {
                if (type === "object") {

                    if (value?.type === "Buffer" && value?.data) {
                        return Buffer.from(value.data);
                    }

                    return value;

                } else {

                    return value;

                }
            });

            next();

        } else {

            next();

        }
    });

    router.param("_id", (req, res, next, _id) => {
        C_COMPONENT.get(_id, (err, obj) => {
            if (err) {

                logger.warn(`Could not get item "${_id}":`, err);

                res.status(400).json({
                    error: err.message
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
            return res.status(404).end();
        }

        C_COMPONENT.update(req.params["_id"], req.body, (err, result) => {
            if (err) {

                logger.warn(`Could not update item "${req.params._id}":`, err);

                res.status(400).json({
                    error: err.message
                });

            } else {

                res.json(result);

            }
        });

    });

    router.put("/", (req, res) => {
        // NOTE: `req.options` breaks pre hooks
        // redacted for quick fix, issue reopend #169
        C_COMPONENT.add(req.body, (err, result) => {
            if (err) {

                logger.warn(`Could not add item:`, err);

                res.status(400).json({
                    error: err.message
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

                logger.warn(`Could not remove item "${req.params._id}":`, err);

                res.status(400).json({
                    error: err.message
                });

            } else {

                res.json(result);

            }
        });

    });

};