const InterfaceStream = require("./class.interfaceStream.js");
const Interface = require("./class.interface.js");

const mixins = require("../../helper/mixins.js");

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

        this.interfaces.forEach((iface) => {
            global.sharedObjects.interfaces.set(iface._id, iface);
        });

    }
};