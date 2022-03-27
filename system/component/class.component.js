const mongodb = require("mongodb");
const Joi = require("joi");

const _extend = require("../../helper/extend");

const COMMON = require("./class.common.js");


module.exports = class COMPONENT extends COMMON {

    constructor(name, schema, parent) {

        if (parent) {
            require("../prevent_cross_load")(parent);
        }

        super(require("../../system/logger").create(name));

        this.items = []; // NOTE hide this behind a proxy object to watch for changes, like update schema when changed?
        this.collection = mongodb.client.collection(name);
        this.schema = Joi.object({
            ...schema,
            timestamps: Joi.object({
                created: Joi.number().allow(null).default(null),
                updated: Joi.number().allow(null).default(null)
            })
        });

        if (process.env.DATABASE_WATCH_CHANGES === "true") {
            try {

                let changeStream = this.collection.watch();

                this.logger.verbose("Watch for database changes");

                // NOTE if we dont watch for the close event
                // the watched stream keeps mocha waiting for exit
                // till the timeout error is reached
                mongodb.connection.once("close", () => {
                    changeStream.close(() => {
                        this.logger.verbose("Watchstream closed!");
                    });
                });

                changeStream.on("error", (err) => {
                    if (err.code === 40573) {

                        // change stream is not supported
                        // ignore everything
                        this.logger.warn("Database/cluster is not running as replica set, could not watch for changes: ", err);

                    } else {

                        this.logger.warn("Error in watch streams", err);

                    }
                });

                changeStream.on("change", (event) => {
                    // replace is used when updated via mongodb compass
                    // updated is used when called via api/`.update` method
                    if (event.operationType === "replace") {

                        let { fullDocument } = event;

                        let target = this.items.find((item) => {
                            return String(item._id) === String(fullDocument._id);
                        });

                        // skip if nothing found
                        if (!target) {
                            return;
                        }

                        // NOTE use: extend(target, fullDocument);?!
                        Object.assign(target, fullDocument);

                        // feedback
                        this.logger.debug(`Updated item object (${target._id}) due to changes in the database`, target);

                        // trigger update event
                        // TODO trigger update event, so changes can be detect via websockets /events API?
                        this.events.emit("update", [target]);

                    } else if (event.operationType === "update") {

                        // FIXME deconstruct "documentKey" too
                        let { updateDescription: { updatedFields } } = event;

                        let target = this.items.find((item) => {
                            return String(item._id) === String(event.documentKey._id);
                        });

                        // skip if nothing found
                        if (!target) {
                            return;
                        }

                        // NOTE use: extend(target, fullDocument);?!
                        Object.assign(target, updatedFields);

                        // feedback
                        this.logger.debug(`Updated item object (${target._id}) due to changes in the database`, target);

                        // trigger update event
                        // TODO trigger update event, so changes can be detect via websockets /events API?
                        this.events.emit("update", [target]);

                    } else if (["insert", "delete", "drop", "rename"].includes(event.operationType)) {

                        // NOTE: Good solution for HA/LB
                        // https://github.com/OpenHausIO/backend/issues/67
                        // https://docs.mongodb.com/manual/reference/change-events/#insert-event
                        // https://docs.mongodb.com/manual/reference/change-events/#delete-event
                        // https://docs.mongodb.com/manual/reference/change-events/#drop-event
                        // https://docs.mongodb.com/manual/reference/change-events/#rename-event
                        this.logger.verbose(`$watch operation (${event.operationType}) not implemented!`);

                    }
                });

            } catch (err) {

                this.logger.error("Error while watching mongodb change streams", err);

            }
        }


        this._defineMethod("add", (final) => {

            final((item) => {
                this.items.push(item);
                return Promise.resolve();
            });

            return (data) => {
                return new Promise((resolve, reject) => {

                    data.timestamps = {
                        created: Date.now(),
                        updated: null
                    };

                    // TODO Sanitze input fields!?
                    let result = this.schema.validate(data);

                    if (result.error) {
                        reject(result.error);
                        return;
                    }

                    this.collection.insertOne(result.value, (err, result) => {
                        if (err) {

                            reject(err);

                        } else {

                            // resolve takes a array
                            // these are arguments passed to the callback function
                            // when resolve is called, the cb function gets as first argument, null
                            // and every entry from the array as parameter
                            resolve([result.ops[0]]);

                        }
                    });
                });
            };


        });


        this._defineMethod("get", () => {
            return (_id) => {
                return new Promise((resolve) => {

                    let item = this.items.find((item) => {
                        return String(item._id) === String(_id);
                    });

                    // keep asynchron stuff asynchron
                    process.nextTick(() => {
                        resolve([item]);
                    });

                });
            };
        });


        this._defineMethod("remove", (final) => {

            final((target) => {
                return new Promise((resolve) => {

                    let index = this.items.indexOf(target);
                    this.items.splice(index, 1);

                    resolve();

                });
            });

            return (_id) => {
                return new Promise((resolve, reject) => {

                    let target = this.items.find((obj) => {
                        return obj._id === _id;
                    });

                    this.collection.removeOne({
                        _id: new mongodb.ObjectID(_id)
                    }, (err, { result }) => {
                        if (err) {

                            reject(err);

                        } else {

                            if (result.n === 1 && result.ok === 1 && target) {
                                resolve([target, result, _id]);
                            } else {
                                reject(new Error("Invalid result returnd"));
                            }

                        }
                    });

                });
            };

        });


        this._defineMethod("update", () => {
            return (_id, data) => {
                return new Promise((resolve, reject) => {

                    let target = this.items.find((item) => {
                        return String(item._id) === String(_id);
                    });

                    if (!target) {
                        // TODO create custom "NOT_FOUND_ERRORE" ?!
                        return reject(new Error("Not found"));
                    }

                    data._id = String(_id);
                    let shallow = _extend({}, target, data);

                    // cant set timestamp $set... some mongodb error occured
                    // but its any way better to set it be stimestamp before validation
                    shallow.timestamps.updated = Date.now();


                    //@TODO Sanitize values
                    let validation = this.schema.validate(shallow);
                    delete validation.value._id; // _id is immutable


                    if (validation.error) {
                        return reject(this.errors.validation(validation.error));
                    }

                    this.collection.findOneAndUpdate({
                        _id: new mongodb.ObjectID(_id)
                    }, {
                        $set: validation.value
                    }, {
                        //returnOriginal: false
                    }, (err) => {
                        if (err) {

                            //console.log("4tpoiwrejtkwienrut", err)
                            reject(err);

                        } else {

                            // TODO HANDLE UPDATE DATA PROPERLY!!!:
                            // - schema valdation fucks on "adapter"/"interface" istance
                            //   -> these are class/object instance and not "string" or what ever
                            // - Convert them on "shallow" object back to string or whatever?!
                            // - What happens after the update?!
                            //   -> Convert them again to interface/adapter instance?!

                            // VIEL GRÖ?ERES PROBLEM!!!!!
                            // Wir arbeiten auf generischier eben hier!
                            // Umwandlung von object/string zu/von object/string
                            // muss in middlware erflogen!!!!!!!!!!!!!!

                            // TODO CHECK RESUTL!
                            // extend exisiting object in items array
                            _extend(target, validation.value);
                            resolve([target]);

                        }
                    });


                });
            };

        });


        this._defineMethod("find", () => {
            return (query) => {
                return new Promise((resolve, reject) => {

                    // https://javascript.plainenglish.io/4-ways-to-compare-objects-in-javascript-97fe9b2a949c
                    // https://stackoverflow.com/a/1068883/5781499
                    // https://dmitripavlutin.com/how-to-compare-objects-in-javascript/

                    let item = this.items.find((item) => {
                        // for (let key of query) { ?!
                        for (let key in query) {

                            if (item[key] === query[key]) {
                                return true;
                            } else {
                                return false;
                            }

                        }
                    });

                    if (!item) {
                        return reject(new Error("NOT_FOUND"));
                    }

                    resolve([item]);

                });
            };
        });

    }

    /*
        _exportItemMethod(name, promise = false) {
            this._defineMethod(name, (final) => {
    
                return (...args) => {
                    return new Promise((resolve, reject) => {
    
    
    
                    });
                };
    
            });
        }
        */


    /*

    // TODO hook methods & emit events
    // NOTE use/wrapp this._defineMethod for that?!
    _defineItemMethod(name) {
        Object.defineProperty(this, name, {
            value: (...args) => {
                try {

                    let _id = args[0];

                    let item = this.items.find((item) => {
                        return item._id === _id;
                    });

                    if (!item) {
                        this.logger.warn(new Error(`Item "${_id}" not found to call method "${name}" on it`));
                        return;
                    }

                    if (Object.prototype.hasOwnProperty.call(item, name) && item[name] instanceof Function) {
                        return item[name].apply(item, args);
                    } else {
                        this.loggerlogger.warn(`Property "${name}" was not found on item "${item._id}" or is not a function`);
                    }

                } catch (err) {

                    this.logger.warn(err);

                    // re-throw 
                    throw err;

                }
            },
            writable: false,
            enumerable: false,
            configurable: false
        });
        */

};