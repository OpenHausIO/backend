const Notification = require("./class.notifications.js");


module.exports = {
    Notification,
    events: Notification.events(),
    notifications: Notification.notifications()
};