const { Cron } = require("../../system/cronjob");
const cron = new Cron();

const { emitter, emitted } = require("../../system/component/class.events.js");

module.exports = {

    "cronjob": (trigger, params) => {
        cron.add(params.cron, () => {
            trigger.fire();
        });
    },

    "state": (trigger, params) => {

        // this should check for state changes of endpoints
        // requires a "eventbus" and some additionl code in endpoints
        // params.endpoint = endpoint object id
        // params.state = endpoint state object id
        // check if greater/lower than threshold or how to react?

        let locked = false;

        // NOTE: why do i not use "state" event here?
        emitter.on(emitted, ({ args, event, component }) => {
            if (event === "state" && args[0].type === "number" && args[0]._id === params._id && component === "endpoints") {

                let match = false;
                let a = args[0].value;
                let b = params.threshold;

                // a = state value
                // b = threshold
                switch (params.operator) {
                    case "<":
                        match = a < b;
                        break;
                    case ">":
                        match = a > b;
                        break;
                    case "<=":
                        match = a <= b;
                        break;
                    case ">=":
                        match = a >= b;
                        break;
                    case "==":
                        match = a == b;
                        break;
                    default:
                        match = false;
                }

                // trigger & lock 
                if (match && !locked) {
                    locked = true;
                    trigger.fire();
                }

                // reset lock based on operator
                if (params.operator === "<" || params.operator === "<=") {
                    if (a > b && locked) {
                        locked = false;
                    }
                } else if (params.operator === ">" || params.operator === ">=") {
                    if (a < b && locked) {
                        locked = false;
                    }
                } else if (params.operator === "==") {
                    if (a !== b && locked) {
                        locked = false;
                    }
                }

            }
        });


    }

    /*
    "webhook": (trigger, { param }) => {
        // this waits for a http client to hit a webhook route
        // the webhook itself should be "fire" some event
        // we can listen to from the eventbus
        // param.webhhok = mongodb _id
    }
    */

    /*
    "scene": (trigger, { param }) => {
        // this waits for another scene to get executed
        // check for dispatcher events?
        // but this would only be executed when dispatcher is used
        // how to check for all scenes?
        // would be much easier with eventbus
        dispatcher.on("scene", ({scene}) => {
            if(scene === param._id){
                trigger.fire();
            }
        });        
    }
    */

};