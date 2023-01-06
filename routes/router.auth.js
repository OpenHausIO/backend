const jwt = require("jsonwebtoken");
const C_USERS = require("../components/users");

module.exports = (app, router) => {

    router.get("/", (req, res) => {

        console.log("/auth request from:", req.ip);

        if (process.env.API_AUTH_ENABLED === "true") {

            // tell the client it needs to authenticate
            res.status(401).end();

        } else {

            // its ok, just start with api requests
            res.status(200).end();

        }

    });

    router.post("/login", (req, res) => {
        C_USERS.login(req.body.email, req.body.password, (err, user) => {
            if (err) {

                res.status(401).end();

            } else {

                if (!user) {
                    res.status(401).end();
                    return;
                }

                // add token for user
                user.addToken((err, token) => {
                    if (err) {

                        res.status(401).end();

                    } else {

                        // set header with token
                        res.set("x-auth-token", token);

                        res.status(200).json({
                            token,
                            success: true
                        });

                    }
                });

            }
        });
    });

    router.post("/logout", (req, res) => {
        if (req.headers["x-auth-token"]) {

            let decoded = jwt.decode(req.headers["x-auth-token"]);

            if (!decoded.uuid || decoded.uuid !== process.env.UUID) {
                res.status(401).end();
                return;
            }

            C_USERS.logout(decoded.email, (err, user, success) => {
                if (err) {

                    res.status(401).end();

                } else {

                    if (!user) {
                        res.status(401).end();
                        return;
                    }

                    res.status(200).json({
                        success
                    });

                }
            });

        } else {

            res.status(401).end();

        }
    });

};