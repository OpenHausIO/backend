const mongodb = require("mongodb");
const Joi = require("joi");

//const util = require("util");

//const logger = require("../../system/logger").create("endpoints");
//const COMMON_COMPONENT = require("../../system/component/common.js");
const COMPONENT = require("../../system/component/class.component.js");


const Endpoint = require("./class.endpoint.js");
const Command = require("./class.command.js");
const State = require("./class.state.js");


//const _expose = require("../../helper/expose.js");

/**
 * @description
 * The Endpoints component is responsible for triggering commands, handle states & manage all kind of things that a endpoint does.<br />
 * This is a line break
 *
 * @class C_ENDPOINTS
 * @extends COMPONENT system/component/class.component.js
 * 
 * @example 
 * ```js
 * const C_ENDPOINTS = require(".../components/endpoints");
 * 
 * C_ENDPOINTS.hooks.post("update", (item, next) => {
 *   console.log("Updated item", item);
 *   next();
 * });
 * ```
 * 
 * @example
 * ```js
 * const C_ENDPOINTS = require(".../components/endpoints");
 * 
 * console.log(C_ENDPOINTS.items);
 * ```
 */
class C_ENDPOINTS extends COMPONENT {
    constructor() {

        // inject logger, collection and schema object
        super("endpoints", {
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
        }, module);


        this.hooks.post("add", (data, next) => {
            next(null, new Endpoint(data));
        });


        /*
        // expose item functions
        this.triggerCommand = _expose(this.items, "triggerCommand");
        this.setState = _expose(this.items, "setState");

        // expose/map item methods
        this._mapMethod("foo", "foo", this.items);
        this._mapMethod("foo1", "triggerCommand", this.items);
        this._mapMethod("foo2", "setState", this.items);
        */

        /*
                this._defineMethod("foo", () => {
                    return (_id, ...args) => {
                        return new Promise((resolve, reject) => {
        
                            args.push((err, ...args) => {
                                if (err) {
        
                                    reject(err);
        
                                } else {
        
                                    resolve(args);
        
                                }
                            });
        
                            _expose(this.items, "foo")(_id, ...args);
        
                        });
                    };
                })
                */


    }
}


// create component instance
const instance = module.exports = new C_ENDPOINTS();


// init component
// set items/build cache
instance.init((scope, ready) => {
    scope.collection.find({}).toArray((err, data) => {
        if (err) {

            // shit...
            ready(err);

        } else {

            data = data.map((item) => {
                return new Endpoint(item);
            });

            scope.items.push(...data);

            // init done
            ready(null);

        }
    });
});