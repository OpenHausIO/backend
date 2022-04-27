const Commands = require("./class.commands.js");
const States = require("./class.states.js");

/**
 * @description
 * Endpoint item, stored in the component `.items` Array.
 * 
 * @class Endpoint
 * 
 * @param {Object} obj Object that matches the item schema. See properties below:
 * 
 * @property {String} [_id=ObjectID] MongoDB ObjectID as String
 * @property {String} name User friendly name
 * @property {Boolean} [enabled=true] Is hits item active?
 * @property {String} room MongoDB ObjectID as String
 * @property {String} device MongoDB ObjectID as String
 * @property {Commands} commands Commands Array
 * @property {States} states States Array
 * @property {String} [identifier=null] Machine readable/hardcoded identifier
 * @property {String} icon [Fontawesome](https://fontawesome.com/) icon class
 * 
 * @see Rooms components/rooms/
 * @see Devices components/devices/
 * @see InterfaceStream components/devices/class.interfaceStream.js
 */
module.exports = class Endpoint {

    constructor(obj) {

        Object.assign(this, obj);
        this._id = String(obj._id);

        this.commands = new Commands(obj.commands);
        this.states = new States(obj.states);

        //this.triggerCommand = _expose(this.commands, "triggerCommand");
        //this.setState = _expose(this.states, "setState");

        //this.method1 = _expose(this.commands, "method1");
        //this.method2 = _expose(this.states, "method2");

    }

    /*
    triggerCommand(...args) {
        console.log(".triggerCommand called", args);
    }

    setState() {
        console.log(".setState called");
    }


    foo(cb) {
        console.log(".foo called");
        cb(null, "foo", "hello");
    }
    */

};