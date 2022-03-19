const process = require("process");
const mongodb = require("mongodb");
const Joi = require("joi");

const COMPONENT = require("./index.js");

const extend = require("../../helper/extend");


class COMPONENT_ERROR extends Error {
    constructor(code, details, _id) {

        super();

        this.code = `ERR_${code.toUpperCase()}`;
        this.details = details || null;
        //this._id = id || null;
        this.timestamp = Date.now();

        switch (code) {
            case "validation":
                this.message = "Validation on dataset failed";
                break;
            case "not_found":
                this.message = `Item with _id "${_id}" does not exists`;
                break;
            case "fetch":
                this.message = "Fetching of data failed";
                break;
            case "add":
                this.message = "Could not add dataset";
                break;
            case "get":
                this.message = "Could not get dataset";
                break;
            case "remove":
                this.message = "Could not remove dataset";
                break;
            case "update":
                this.message = "Could not update dataset";
                break;
            default:
                this.message = `Unknown error code "${code}"`;
                break;
        }

    }

    static method(name, details) {
        return new this(name, details);
    }

    static validation(details) {
        return new this("validation", details);
    }

}


module.exports = class COMMON_COMPONENT extends COMPONENT {
    constructor(logger, collection, schema, module) {

        // allow only <cwd>/index.js to load components
        // abort as quick as possible
        if (module) {
            require("../prevent_cross_load")(module);
        }


        super();

        this.items = [];

        this.schema = Joi.object({
            ...schema,
            timestamps: Joi.object({
                created: Joi.number().allow(null).default(null),
                updated: Joi.number().allow(null).default(null)
            })
        });

        if (typeof (collection) === "string") {
            this.collection = mongodb.client.collection(collection);
        } else {
            this.collection = collection;
        }

        this.errors = COMPONENT_ERROR;
        this.logger = logger;

        if (process.env.DATABASE_WATCH_CHANGES === "true") {
            try {

                let changeStream = this.collection.watch();

                this.logger.verbose("Watch for database changes");

                changeStream.on("error", (err) => {
                    if (err.code === 40573) {

                        // change stream is not supported
                        // ignore everything
                        this.logger.warn("Database/cluster is not running as replica set");
                        this.logger.error("Could not watch for changes: ", err);

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



        this._defineMethod2("add", (final) => {

            // this gets triggerd after all post hooks            
            /*
            final((item) => {
                return new Promise((resolve) => {

                    this.items.push(item);
                    resolve();

                });
            });
            */

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

                    //@TODO Sanitze input fields!
                    let result = this.schema.validate(data);

                    if (result.error) {
                        reject(this.errors.validation(result.error));
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


        }, logger);


        this._defineMethod2("get", () => {

            // this gets triggerd after all post hooks            
            /*
            // add the last get item to array, this is bug, see #41 / #45
            final((item) => {
                return new Promise((resolve) => {

                    this.items.push(item);
                    resolve();

                });
            });
            */

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

        }, logger);


        this._defineMethod2("remove", (final) => {

            final((result, _id) => {
                return new Promise((resolve) => {

                    let target = this.items.find((item) => {
                        return String(item._id) === String(_id);
                    });

                    let index = this.items.indexOf(target);
                    this.items.splice(index, 1);

                    resolve();

                });
            });

            return (_id) => {
                console.log("REMOGE", _id);
                return new Promise((resolve, reject) => {

                    this.collection.removeOne({
                        _id: new mongodb.ObjectID(_id)
                    }, (err, result) => {
                        if (err) {

                            reject(err);

                        } else {

                            resolve([result, _id]);

                        }
                    });

                });
            };

        }, logger);


        this._defineMethod2("update", () => {

            /*
            final((data, target) => {
                return new Promise((resolve) => {
                    resolve();
                });
            });
            */

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
                    let shallow = extend({}, target, data);

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
                            extend(target, validation.value);
                            resolve([target]);

                        }
                    });


                });
            };

        }, logger);


        this._defineMethod2("find", () => {

            /*
            final.then(() => {...});
            final((data, target) => {
                return new Promise((resolve) => {
                    resolve();
                });
            });
            */

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

        }, logger);


    }

};