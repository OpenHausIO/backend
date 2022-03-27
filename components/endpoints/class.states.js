const State = require("./class.state.js");

// NOTE: create request/response classes for commands like http?
module.exports = class States extends Array {

    /**
     * Commands object, array like
     * @constructor
     * @param {Array} arr Command objects
     */
    constructor(arr) {

        super();


        // without this, <this>.map throws type error:
        // TypeError: items.forEach is not a function
        // <items> is when map function is called a number
        if (arr instanceof Array) {
            arr.forEach((obj) => {
                this.push(new State(obj));
            });
        }

    }

    setValue(_id, value, cb) {

        let target = this.find((obj) => {
            return _id === obj._id;
        });

        if (!target) {
            cb(new Error(`Item with _id "${_id}" not found`));
        }

        target.value = value;

    }

};