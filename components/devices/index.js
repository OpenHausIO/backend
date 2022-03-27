const mongodb = require("mongodb");
const Joi = require("joi");


// for development its usefull if we detect 
// that component are not inital loaded/required from "index.js"
//require("../../system/prevent_cross_load.js")(module);


// create component logger & require root component
// inherit methods & properites from common component
//const logger = require("../../system/logger").create("devices");
//const COMMON_COMPONENT = require("../../system/component/common.js");
const COMPONENT = require("../../system/component/class.component.js");


//require("./class.interface.js");
//require("./class.interfaceStream");

const Interface = require("./class.interface.js");
const Device = require("./class.device.js");


class C_DEVICES extends COMPONENT {

    constructor() {

        // inject logger, collection and schema object
        // https://stackoverflow.com/a/37746388/5781499
        super("devices", {
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return String(new mongodb.ObjectID());
            }),
            name: Joi.string().required(),
            room: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).allow(null).default(null),
            enabled: Joi.boolean().default(true),
            //interfaces: Joi.array().items(Interface.schema()).min(1).required()
            interfaces: Joi.array().min(1).items(Interface.schema()).required()
        }, module);


        // create for new added device interfaces
        // a valid mongodb object id for identification
        this.hooks.pre("add", (data, next) => {

            if (!data.interfaces || !(data.interface instanceof Array)) {
                return next();
            }

            // NOTE Needed if defined in schema?!
            data.interfaces.forEach((iface) => {
                iface._id = String(new mongodb.ObjectID());
            });

            next();

        });


        // create after db manipulation a new device instace
        // use ["add", "update"]?!
        this.hooks.post("add", (data, next) => {
            next(null, new Device(data));
        });


        this.hooks.pre("update", (_id, data, next) => {

            // before we update a device item
            // we need to convert "interface"/"adapter" instance, back to schema allowd types

            let target = this.items.find((item) => {
                return String(item._id) === String(_id);
            });

            // We should not operate on the original device object
            // so create a shallow copy of the object and 
            // override the shallow copy with data to update            
            let shallow = Object.assign({}, target, data);

            shallow.interfaces = target.interfaces.map((iface) => {
                iface.adapter = iface.adapter.map((adapter) => {
                    return adapter.name;
                });
                return iface;
            });

            next(null, _id, shallow);

        });

    }

    match() {

        let matches = this.items.filter((device) => {
            return device.name === "ZigBee Gateway";
        });

        return matches;

    }

}


// create component instance
const instance = module.exports = new C_DEVICES();


// init component
// set items/build cache
instance.init((scope, ready) => {
    scope.collection.find({}).toArray((err, data) => {
        if (err) {

            // shit...
            ready(err);

        } else {


            data = data.map((item) => {
                return new Device(item);
            });


            scope.items.push(...data);

            // init done
            ready(null);

        }
    });
});