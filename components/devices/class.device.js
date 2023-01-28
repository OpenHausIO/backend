const InterfaceStream = require("./class.interfaceStream.js");
const Interface = require("./class.interface.js");

const mixins = require("../../helper/mixins.js");

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
module.exports = class Device {
    constructor(props) {

        // set properties from db
        Object.assign(this, props);
        this._id = String(props._id);

        // create for each interface a interface class instance
        // for each interface class, create a interface stream
        this.interfaces = props.interfaces.map((obj) => {

            let stream = new InterfaceStream({
                // duplex stream options
                emitClose: false
            }, obj.adapter);

            // for debug purpose
            // static [Symbol.hasInstance](obj) {} caused strange bevour
            //stream._id = obj._id;

            let iface = new Interface(obj, stream);


            // "hide" stream behind iface object
            // so we can use the interface object
            // as duplex stream
            return mixins([iface, stream], {
                setPrototype: true,
                //transparent: false
            });

        });

        let { interfaces } = require("../../system/shared.js");

        this.interfaces.forEach((iface) => {
            //global.sharedObjects.interfaces.set(iface._id, iface);
            interfaces.set(iface._id, iface);
        });

    }
};