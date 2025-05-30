const dispatcher = require("../../system/dispatcher");

module.exports = {

    // makro should have following signature
    // before implementing #519
    // (<scene>, <params>, {resolve, reject, signal, options})
    // scene = scene instance
    // params = makro specific object, e.g. command id/timer value
    // wrapper object to fullfill/abort execution
    // - resolve = Promise.resolver();
    // - reject = Promise.reject();
    // - signal = AbortController.signal
    // - options = "custom" options for makro, similar to params object
    //   > maybe can be merged with params object
    //   > currently only one option "parallel", comes into my mind
    //   > but this would also be only command makro specific, so it could/sould be merged into params object
    //   options.value = timer value
    //   options.parallel = Boolean
    //   options.params = Arry, command params
    // NOTE: The above, should also be adapted and applied to trigger types

    "timer": (scene, { resolve, reject, signal, makro }) => {

        let timeout = setTimeout(() => {
            resolve();
        }, makro.value);

        signal.addEventListener("abort", () => {
            clearTimeout(timeout);
            reject();
        }, {
            once: true
        });

    },


    "command": (scene, { resolve, makro }) => {

        dispatcher({
            "component": "endpoints",
            "item": makro.endpoint,
            "method": "trigger",
            "args": [makro.command, makro.params || [], () => {
                if (!makro?.parallel) {
                    resolve();
                }
            }]
        });

        // use as default parallel if undefined
        if (makro?.parallel ?? true) {
            resolve();
        }

    },


    "scene": (scene, { resolve, makro }) => {

        dispatcher({
            "component": "scenes",
            "item": makro.scene,
            "method": "trigger",
            "args": []
        });

        resolve();

    },

    // create enable/disable makro
    // calls via dispatcher update

    /*
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
                    //resolve(_id);

                }]
            });

            // this does not wait for the prveious command to execute
            // execute next makro in scenes, see #505
            // pro: "parallel" execution of commands
            // contra: timestamp started/finished does not match. e.g.:
            // `.finished` is set before the last command is executed
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
    */

};