const { Router } = require("express");

module.exports = (router) => {

    // protect system route(r|s)
    router.use((req, res, next) => {

        // protect system routes here
        // - could check here if a user is admin
        // - src ip = whitelisted
        // - etc. pp.
        // if(!req.user.admin){ return res.status(403).end(); }

        next();

    });

    // create sub router
    let infoRouter = Router();
    let eventsRouter = Router();
    let notificationsRouter = Router();
    let logsRouter = Router();

    // http://127.0.0.1/api/system/info
    // FIXME: what does this work with "eventsRouter/notificationsRouter"?!
    router.use("/info", infoRouter);
    require("./router.system.info.js")(infoRouter);

    // http://127.0.0.1/api/system/events
    router.use("/events", eventsRouter);
    require("./router.system.events.js")(eventsRouter);

    // http://127.0.0.1/api/system/notifications
    router.use("/notifications", notificationsRouter);
    require("./router.system.notifications.js")(notificationsRouter);

    // http://127.0.0.1/api/system/logs
    router.use("/logs", logsRouter);
    require("./router.system.logs.js")(logsRouter);

};