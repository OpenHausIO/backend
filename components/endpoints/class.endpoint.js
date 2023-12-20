const Command = require("./class.command.js");
const State = require("./class.state.js");
//const Commands = require("./class.commands.js");
//const States = require("./!class.states.js");
const Item = require("../../system/component/class.item.js");

const _expose = require("../../helper/expose.js");

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
module.exports = class Endpoint extends Item {
    constructor(obj) {

        super(obj);

        // removed for #356
        //Object.assign(this, obj);
        //this._id = String(obj._id);

        //this.commands = new Commands(obj.commands);
        //this.states = new States(obj.states);

        this.states = obj.states.map((item) => {
            return new State(item);
        });

        this.commands = obj.commands.map((item) => {
            return new Command(item);
        });

        //this.setHandler = _expose(this.commands, "setHandler");
        //this.getHandler = _expose(this.commands, "getHandler");
        //this.setState = _expose(this.states, "setState");

        //this.method1 = _expose(this.commands, "method1");
        //this.method2 = _expose(this.states, "method2");

        Object.defineProperty(this, "trigger", {
            value: _expose(this.commands, "trigger"),
            enumerable: false,
            configurable: false,
            writable: false
        });

    }
};