const mongodb = require("mongodb");
const Joi = require("joi");



const logger = require("../../system/logger").create("endpoints");
const COMMON_COMPONENT = require("../../system/component/common.js");


const Endpoint = require("./class.endpoint.js");
const Command = require("./class.command.js");



class C_ENDPOINTS extends COMMON_COMPONENT {
    constructor() {

        // inject logger, collection and schema object
        super(logger, mongodb.client.collection("endpoints"), {
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return String(new mongodb.ObjectID());
            }),
            name: Joi.string().required(),
            enabled: Joi.boolean().default(true),
            room: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
            device: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
            commands: Joi.array().items(Command.schema()).min(1).required(),
            identifier: Joi.any()   // usefull for ssdp, etc.
        }, module);

        this.hooks.pre("add", (data, next) => {

            if (!data.commands || !(data.commands instanceof Array)) {
                console.log("Invalid command array");
                return next();
            }

            try {

                // NOTE Needed if defined in schema?!
                data.commands.forEach((cmd) => {

                    // TODO test static validation
                    let { valid, error } = Command.validate(cmd);


                    if (error) {
                        // TODO err does not reach frontend/client
                        // is only display on cli/terminal but the http request is not aborted
                        throw new Error(`Command validation failed: ${error}`);
                    }

                    cmd._id = String(new mongodb.ObjectID());

                });

                next();

            } catch (err) {

                next(err);

            }

        });


        this.hooks.post("add", (data, next) => {
            next(null, new Endpoint(data));
        });


    };
};


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