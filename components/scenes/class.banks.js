const Bank = require("./class.bank");

module.exports = class Banks extends Array {
    constructor(...args) {

        super(...args);

        if (args instanceof Array) {
            args.forEach((arr) => {

                this.push(new Bank(arr));

            });
        }

    };
};