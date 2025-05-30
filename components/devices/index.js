const mongodb = require("mongodb");


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

const Device = require("./class.device.js");
const Interface = require("./class.interface.js");
//const InterfaceStream = require("./class.interfaceStream.js");

/**
 * @description
 * Device component class<br />
 * Represents a device instance in the component `.items` Array.
 * 
 * @class C_DEVICES
 * @extends COMPONENT system/component/class.component.js
 * 
 * @example
 * ```js
 * const C_DEVICES = require(".../component/devices/");
 * 
 * C_DEVICES.find({
 *   enabled: true
 * }).then((devices) => {
 *   console.log(devices);
 * }).catch((err) => {
 *   console.log(err);
 * });
 * ```
 * 
 * @example
 * ```json
[
    {
        "_id": "625c307b26cdd30f007989ca",
        "name": "Samsung Fridge",
        "interfaces": [
            {
                "type": "ETHERNET",
                "settings": {
                    "host": "172.16.5.23",
                    "port": 8080,
                    "socket": "tcp",
                    "mac": null
                },
                "_id": "625c307b26cdd30f007989cb",
                "adapter": [
                    "raw"
                ]
            }
        ],
        "timestamps": {
            "created": 1650208891581,
            "updated": null
        },
        "room": null,
        "enabled": true
    },
    {
        "name": "ZigBee Gateway",
        "interfaces": [
            {
                "type": "ETHERNET",
                "description": "RESTful API",
                "settings": {
                    "host": "172.16.4.12",
                    "port": 80,
                    "socket": "tcp",
                    "mac": null
                },
                "_id": "625c311123ed9311d25efbec",
                "adapter": [
                    "raw"
                ]
            },
            {
                "type": "ETHERNET",
                "description": "WebSocket API",
                "settings": {
                    "host": "172.16.4.12",
                    "port": 443,
                    "socket": "tcp",
                    "mac": null
                },
                "_id": "625c311123ed9311d25efbed",
                "adapter": [
                    "raw"
                ]
            }
        ],
        "timestamps": {
            "created": 1650209041327,
            "updated": null
        },
        "_id": "625c311123ed9311d25efbeb",
        "room": null,
        "enabled": true
    },
    {
        "name": "AV Receiver",
        "interfaces": [
            {
                "type": "ETHERNET",
                "description": "eISCP Interface",
                "settings": {
                    "host": "192.168.2.10",
                    "port": 60128,
                    "socket": "tcp",
                    "mac": null
                },
                "adapter": [
                    "eiscp"
                ],
                "_id": "625c330e23ed9311d25efbef"
            }
        ],
        "timestamps": {
            "created": 1650209550659,
            "updated": null
        },
        "_id": "625c330e23ed9311d25efbee",
        "room": null,
        "enabled": true
    }
]
```
 * 
 */
class C_DEVICES extends COMPONENT {
    constructor() {

        // inject logger, collection and schema object
        // https://stackoverflow.com/a/37746388/5781499
        super("devices", Device.schema(), [
            Device,
            Interface,
            //InterfaceStream
        ]);


        // create for new added device interfaces
        // a valid mongodb object id for identification
        this.hooks.pre("add", (data, next) => {

            if (!data.interfaces || !(data.interface instanceof Array)) {
                return next();
            }

            // NOTE: Needed if defined in schema?!
            data.interfaces.forEach((iface) => {
                iface._id = String(new mongodb.ObjectId());
            });

            next();

        });


        // create after db manipulation a new device instace
        // use ["add", "update"]?!
        this.hooks.post("add", (data, next) => {
            next(null, new Device(data));
        });

        /*
        // cause a update bug
        // see #171
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
                */

    }
}


// create component instance
const instance = module.exports = new C_DEVICES();


// init component
// set items/build cache
instance.init((scope, ready) => {
    scope.collection.find({}).toArray().then((data) => {

        data.forEach((obj) => {

            let item = new Device(obj);
            scope.items.push(item);

        });

        // init done
        ready(null);

    }).catch((err) => {

        ready(err);

    });
});