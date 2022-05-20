const C_VAULT = require("../components/vault");

module.exports = (app, router) => {

    router.post("/:_id/encrypt", (req, res) => {
        C_VAULT.encrypt(req.item._id, req.body, (err) => {
            if (err) {

                res.status(400).end(err);

            } else {

                res.json(req.item);

            }
        });
    });

    router.post("/:_id/decrypt", (req, res) => {
        C_VAULT.decrypt(req.item._id, (err, values) => {
            if (err) {

                res.status(400).end(err);

            } else {

                res.json(values);

            }
        });
    });

};