const Joi = require("joi");
const mongodb = require("mongodb");

const Command = require("./class.command.js");
const State = require("./class.state.js");
//const Commands = require("./class.commands.js");
//const States = require("./!class.states.js");
const Item = require("../../system/component/class.item.js");

const _expose = require("../../helper/expose.js");
const _debounce = require("../../helper/debounce.js");

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
    constructor(obj, scope) {

        super(obj);

        // removed for #356
        //Object.assign(this, obj);
        //this._id = String(obj._id);

        //this.commands = new Commands(obj.commands);
        //this.states = new States(obj.states);

        // see 407 & 420
        let updater = _debounce(async () => {
            try {

                // trigger update on endpoint item
                // otherwise ui is not rendered/refreshed on state changed
                await scope.update(this._id, this);

                // feedback
                scope.logger.verbose("Endpoint states updated", this.states);

            } catch (err) {

                scope.logger.warn(err, "Could not update item states after debouncing");

            }
        }, 100);

        // see 407 & 420
        this.states = obj.states.map((item) => {
            return new State(item, () => {
                try {

                    // feedback 
                    scope.logger.verbose(`Value in endpoint ("${obj._id}") state ("${item._id}") changed: ${item.alias}=${item.value}`);

                    // update item in database 
                    //await scope.update(this._id, this); 
                    updater();

                } catch (err) {

                    scope.logger.warn(err, `Could not update item (${obj._id}) state ("${item._id}") in database: ${item.alias}=${item.value}`);

                }
            });
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

    static schema() {
        return Joi.object({
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return String(new mongodb.ObjectId());
            }),
            name: Joi.string().required(),
            enabled: Joi.boolean().default(true),
            room: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).allow(null).default(null),
            device: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
            commands: Joi.array().items(Command.schema()).default([]),
            states: Joi.array().items(State.schema()).default([]),
            identifier: Joi.any().allow(null).default(null),   // usefull for ssdp, etc.
            icon: Joi.string().allow(null).default(null)
        });
    }

    static validate(data) {
        return Endpoint.schema().validate(data);
    }

};