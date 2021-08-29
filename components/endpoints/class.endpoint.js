const Commands = require("./class.commands.js");

module.exports = class Endpoint {

    /**
     * Endpoint constructor
     * @constructor
     * @param {*} obj 
     */
    constructor(obj) {

        Object.assign(this, obj);
        this._id = String(obj._id);

        this.commands = new Commands(obj.commands);

    };

};