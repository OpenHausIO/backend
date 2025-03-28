const jwt = require("jsonwebtoken");

module.exports = (C_USERS, router) => {

    const { logger } = C_USERS;

    // check if the request came from the same machine
    // either via reverse proxy or socket
    // if it came via unix socket, handle the request as authentciated
    // even if there was no x-auth-token provided
    router.use((req, res, next) => {

        //let addr = req.socket.address();
        let addr = res.socket.server.address();

        // always say no-no
        req.authenticated = false;

        // TODO:
        // check if no X-Forwarded-For header is not set
        // check for source ip = 127.0.0.1
        // check if server is unix socket
        // if all above are true
        // proceed request as local
        if (addr instanceof Object) {

            // do nothing
            //console.log("IP Server", addr);

        } else if ((typeof addr) === "string" || (addr instanceof String)) {

            if ((!req.ip) && (!req.headers["x-forwarded-for"]) && addr === process.env.HTTP_SOCKET) {
                req.authenticated = true;
            }

        }

        next();

    });


    router.use((req, res, next) => {
        if (process.env.API_AUTH_ENABLED === "true" && !req.authenticated) {

            // override header header token with query token
            // see #266, if we do this not, it breaks the frontend api events
            if (!req.headers["x-auth-token"] && req.query["x-auth-token"]) {
                req.headers["x-auth-token"] = req.query["x-auth-token"];
            }

            if (!req.headers["x-auth-token"] && !req.query["x-auth-token"]) {
                res.status(401).end();
                return;
            }

            jwt.verify(req.headers["x-auth-token"], process.env.USERS_JWT_SECRET, {
                algorithms: [process.env.USERS_JWT_ALGORITHM]
            }, (err, decoded) => {
                if (err) {

                    logger.error(err);
                    res.status(401).end();

                } else {

                    // check if the token was issued from this instance
                    // NOTE: This could be problematic with HA/Loadbalancing
                    if (decoded.uuid !== process.env.UUID) {
                        res.status(401).end();
                        return;
                    }

                    let user = C_USERS.items.find((user) => {
                        return user.email === decoded?.email && user.enabled;
                    });

                    if (!user) {
                        res.status(401).end();
                        return;
                    }

                    if (!user.tokens.includes(req.headers["x-auth-token"])) {
                        res.status(401).end();
                        return;
                    }

                    req.token = decoded;
                    req.user = user;
                    next();

                }
            });

        } else {

            // no authentication, no user
            req.user = null;
            next();

        }
    });


    router.use((req, res, next) => {

        // if not authencicated or request user invalid
        // abort to handle the request
        if (!req.user && !req.authenticated && process.env.API_AUTH_ENABLED === "true") {
            res.status(401).end();
            return;
        }

        //console.log("User request:", req.user, req.authenticated, process.env.API_AUTH_ENABLED, req.ip, req.socket.remoteAddress, req.method, req.url, req.headers);

        next();

    });

};