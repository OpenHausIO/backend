const Notification = require("./class.notification.js");


module.exports = {
    Notification,
    events: Notification.events(),
    notifications: Notification.notifications()
};