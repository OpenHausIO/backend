const utils = require("util")
const Banks = require("./class.banks.js");
const Trigger = require("./class.trigger.js");

module.exports = class Scene {

    constructor(obj) {

        Object.assign(this, obj);
        this._id = String(obj._id);


        Object.defineProperty(this, "running", {
            value: false,
            writable: true
        });


        this.banks = new Banks(obj.banks);

        /*
        this.banks = obj.map((arr) => {
            return new Bank(arr);
        });
*/


        this.triggers = obj.triggers.map((obj) => {

            let trigger = new Trigger(obj);

            trigger.events.on("fired", () => {
                this.start();
            });

            return trigger;

        });


        console.log(this)

    };

    start() {

        if (this.runngin) {
            let err = new Error("Scene is allready running");
            err.code = "STATE_IS_RUNNING";
            return Promise.reject(err);
        }


        /*
        console.log("Scenes fired", this.name, this.triggers[0].fired);

        let banks = this.banks.map((bank) => {
            return bank.execute();
        });

        //console.log("Banks: ", banks)

        let promise = Promise.all(banks).then(() => {

            console.log("Scene executed successful")

        }).catch((err) => {

            console.log("Something went wrong", err)

        }).finally(() => {
            this.running = false;
        });

        //console.log(promise)

        return promise;
        */

        return Promise.reject();

    };

    abort() {

        this.banks.forEach((bank) => {
            bank.abort();
        });

    };

};