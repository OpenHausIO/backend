//const logger = require("../../system/logger").create("rooms");
//const COMMON_COMPONENT = require("../../system/component/common.js");
const COMPONENT = require("../../system/component/class.component.js");

const Webhook = require("./class.webhook.js");

/**
 * @description
 * Implement webhook functionality
 * 
 * @class C_WEBHOOKS
 * @extends COMPONENT system/component/class.component.js
 */
class C_WEBHOOKS extends COMPONENT {
    constructor() {

        // inject logger, collection and schema object
        super("webhooks", Webhook.schema(), [
            Webhook
        ]);

        this.hooks.post("add", (data, next) => {
            next(null, new Webhook(data));
        });

    }
}


// create component instance
const instance = module.exports = new C_WEBHOOKS();


// init component
// set items/build cache
instance.init((scope, ready) => {
    scope.collection.find({}).toArray().then((data) => {

        data.forEach((obj) => {

            let item = new Webhook(obj);
            scope.items.push(item);

        });

        // init done
        ready(null);

    }).catch((err) => {

        ready(err);

    });
});