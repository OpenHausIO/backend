const Joi = require("joi");
const mongodb = require("mongodb");

//const InterfaceStream = require("./class.interfaceStream.js");
const Interface = require("./class.interface.js");
const Item = require("../../system/component/class.item.js");

//const mixins = require("../../helper/mixins.js");
//const injectMethod = require("../../helper/injectMethod.js");

//const { parse, calculateChecksum } = require("./net-helper.js");

/**
 * @description
 * Device item in component `.items` array
 * 
 * @class Device
 * 
 * @param {Object} props Object that matches the item schema. See properties below:
 * 
 * @property {String} _id MongoDB Object id is as string
 * @property {String} name Human readable name
 * @property {String} room Simle identifier to find the secret when you need it
 * @property {Boolean} enabled Can we read/write data to/from the device
 * @property {Array} interfaces Objects that match the interface schema
 * 
 * @see interface components/devices/class.interface.js
 * @see interfaceStream components/devices/class.interfaceStream.js
 */
module.exports = class Device extends Item {
    constructor(props) {

        super(props);

        // removed for #356
        // set properties from db
        //Object.assign(this, props);
        //this._id = String(props._id);

        // create for each interface a interface class instance
        // for each interface class, create a interface stream
        this.interfaces = props.interfaces.map((obj) => {

            return new Interface(obj);

            // NOTE: refactor interfaceStream in v4
            // move .bridge method there and pass device instance?
            // > Would this also create a ciruclar reference in Interface class 
            // > since its stored via `Object.defineProperty(this, "stream",...);`
            /*
            let stream = new InterfaceStream({
                // duplex stream options
                emitClose: false
            }, obj.adapter);

            // for debug purpose
            // static [Symbol.hasInstance](obj) {} caused strange bevour
            //stream._id = obj._id;

            let iface = new Interface(obj, stream);


            // inject bridge method into interface instance
            // passing deivce instance into Interface class, creates a ciruclar reference
            // TODO: Move this into "interfaceStream" (needs to be refactored)
            // NOTE: remove "device" for bridging requests (only needed in connector)? 
            // > See: https://github.com/OpenHausIO/connector/issues/54
            // > When done, "device" property can be removed, and the `.bridge()` method can be moved into Interface class
            /*
            injectMethod(iface, "bridge", (cb) => {
                return Interface._bridge({
                    events: scope.events,
                    interface: iface,
                    device: this._id
                }, cb);
            });
            *


            // "hide" stream behind iface object
            // so we can use the interface object
            // as duplex stream
            return mixins([iface, stream], {
                setPrototype: true,
                //transparent: false
            });
            */

        });

        let { interfaces } = require("../../system/shared.js");

        this.interfaces.forEach((iface) => {
            //global.sharedObjects.interfaces.set(iface._id, iface);
            interfaces.set(iface._id, iface);
        });

    }

    static schema() {
        return Joi.object({
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return String(new mongodb.ObjectId());
            }),
            name: Joi.string().required(),
            room: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).allow(null).default(null),
            enabled: Joi.boolean().default(true),
            //interfaces: Joi.array().items(Interface.schema()).min(1).required()
            interfaces: Joi.array().items(Interface.schema()).default([]),
            meta: {
                manufacturer: Joi.string().allow(null).default(null),
                model: Joi.string().allow(null).default(null),
                revision: Joi.number().allow(null).default(null),
                serial: Joi.string().allow(null).default(null)
            },
            icon: Joi.string().allow(null).default(null)
        });
    }

    static validate(data) {
        return Device.schema().validate(data);
    }

};