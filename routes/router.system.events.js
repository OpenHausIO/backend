module.exports = (router) => {

    // NOTE: this is for compatibility reasons
    // NOTICE: This would break reactiviness of user (non admin) UIs
    // When a new device is added, a user would not see before refreshing the UI
    // in v4 the content from router.api.events.js is moved here
    require("./router.api.events.js")(null, router);

};