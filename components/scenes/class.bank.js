const Joi = require("joi");
const mongodb = require("mongodb");

module.exports = class Bank extends Array {

    constructor(...args) {

        super(...args);


        if (args.length === 1 && args instanceof Array) {
            this.push(...args);
        }

        Object.defineProperty(this, "aborted", {
            value: false,
            writable: true
        });

        Object.defineProperty(this, "running", {
            value: false,
            writable: true
        });

        // delay between command execution
        Object.defineProperty(this, "delay", {
            value: 1000,
            writable: true
        });

    };

    static schema() {
        return Joi.object({
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return new mongodb.ObjectID();
            }),
            command: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return new mongodb.ObjectID();
            }),
            params: Joi.array().items({
                key: Joi.string().required(),
                default: Joi.string(),
                min: Joi.number(),
                max: Joi.number(),
                default: Joi.string()
            }).default([])
        });
    };

    execute() {

        if (this.running) {
            return new Promise(new Error("IS_RUNNING"));
        }

        console.log("Execute bnka", this);

        this.aborted = false;
        this.running = true;

        let stack = this.map((item) => {
            return () => {
                new Promise((resolve, reject) => {
                    try {


                        if (this.aborted) {
                            let err = new Error("ABORTED");
                            err.code = "ABORTED";
                            return reject(err);
                        }


                        // TODO execute command here
                        // with params annd all shit
                        console.log("Execute command:", item);

                        // resolve after delay, prevent negatives
                        setTimeout(resolve, Math.max(this.delay, 0));


                    } catch (err) {

                        console.log("error in bank.execute", err);

                    }
                });
            };
        });

        /*
                let chain = stack.reduce((prev, cur) => {
        
                    console.log(prev)
        
                    return prev.then(cur);
                }, Promise.resolve());
        
                chain.then(() => {
        
                    console.log("Stack executed");
        
                }).catch((err) => {
                    if (err.code === "ABORTED") {
        
                        console.log("Bank execution done")
        
                    } else {
        
                        console.log("Error in stack execution")
        
                    }
                });
        
                */

        return Promise.reject();



    };

    abort() {
        this.aborted = true;
    }

};