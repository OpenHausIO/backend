module.exports = (router) => {

    // NOTE: this is for compatibility reasons
    // in v4 the content from router.api.logs.js is moved here
    require("./router.api.logs.js")(null, router);

};