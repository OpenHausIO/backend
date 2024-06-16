const dispatcher = require("../../system/dispatcher");

module.exports = {

    // TODO (mstirner) change to "sleep" instead!
    "timer": ({ _id, value }, result, signal) => {
        return new Promise((resolve) => {

            let timeout = setTimeout(() => {
                resolve(_id, signal);
            }, value);

            signal.addEventListener("abort", () => {
                clearTimeout(timeout);
            }, {
                once: true
            });

        });
    },

    "command": ({ endpoint, _id, command }) => {
        return new Promise((resolve) => {

            // TODO (mstirner) replace dispatcher with eventbus
            dispatcher({
                "component": "endpoints",
                "item": endpoint,
                "method": "trigger",
                "args": [command, () => {

                    //console.log("Command executed adasdasdfasdfasdfasfdadsfasdf", err || success)
                    // how should this be catched?
                    // reject the makro execution if one command fails?
                    // or ignore it simple, and continue?

                }]
            });

            resolve(_id);

        });
    },

    "scene": ({ scene }) => {
        return new Promise((resolve) => {

            dispatcher({
                "component": "scenes",
                "item": scene,
                "method": "trigger",
                "args": []
            });

            resolve();

        });
    }

};