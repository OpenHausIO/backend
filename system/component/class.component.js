const mongodb = require("mongodb");
const Joi = require("joi");

const _extend = require("../../helper/extend");
const _merge = require("../../helper/merge");

const COMMON = require("./class.common.js");

/**
 * @description
 * Parent class for components which provides hookable, event emitting methods:
 * - add
 * - get
 * - update
 * - remove
 * - find
 * 
 * @class COMPONENT
 * 
 * @extends COMMON system/component/class.common.js
 * 
 * @property {Array} items Store where instance of items are keept
 * @property {Object} collection MongoDB collection instance 
 * @property {Object} schema Joi Object schema which is extend by a timestamp object:
 * @property {Object} schema.timestamps Timestamps
 * @property {Number} schema.timestamps.created Set to `Date.now()` when a item is created/added
 * @property {Number} schema.timestamps.updated Set to `Date.now()` when a item is updated
 * 
 * @emits add When function has completed
 * @emits get When function has completed
 * @emits remove When function has completed
 * @emits update When function has completed
 * @emits find When function has completed
 * 
 * @link https://mongodb.github.io/node-mongodb-native/3.7/api/Db.html#collection
 * @link https://joi.dev/api/?v=17.6.0#object
 */
module.exports = class COMPONENT extends COMMON {

    constructor(name, schema, parent) {

        if (parent) {
            require("../prevent_cross_load")(parent);
        }

        super(require("../../system/logger").create(name));

        // "secret" items array
        let items = [];

        //this.items = []; // NOTE hide this behind a proxy object to watch for changes, like update schema when changed?
        this.items = new Proxy(items, {
            get: (target, prop) => {

                // ignore all methods/properties
                // NOTE check if prop is a number/index?
                if (new RegExp(/^\d+$/).test(prop)) {
                    this.events.emit("get", target[prop]);
                }

                return target[prop];

            },
            set(obj, prop, value) {

                // ignore all methods/properties
                if (new RegExp(/^\d+$/).test(prop)) {

                    // preparation for #75

                    // apply missing item properties here
                    // verfiy object item, if verfiy fails, return false
                    //console.log("Add item: %j", value);

                    //let { error } = schema.validate(value);
                    //return error ? false : true;
                    // save update obj in database?

                    //return false;

                }

                obj[prop] = value;
                return true;

            }
        });

        this.collection = mongodb.client.collection(name);

        this.schema = Joi.object({
            ...schema,
            timestamps: Joi.object({
                ...schema?.timestamps,
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

                        // get original property descriptor
                        //let descriptor = Object.getOwnPropertyDescriptors(target);
                        //console.log("replace event", descriptor.config)

                        // no matter from what tool the update is triggerd
                        //Object.assign(target, fullDocument);
                        _merge(target, fullDocument);

                        // override existing properties
                        //Object.defineProperties(target, descriptor);
                        //console.log("replace event", Object.getOwnPropertyDescriptors(target).config)

                        // feedback
                        this.logger.debug(`Updated item object (${target._id}) due to changes in the collection`);

                        // trigger update event
                        // TODO trigger update event, so changes can be detect via websockets /events API?
                        this.events.emit("update", [target]);

                    } else if (event.operationType === "update") {

                        // FIXME deconstruct "documentKey" too
                        //let { updateDescription: { updatedFields } } = event;
                        let { updateDescription: { updatedFields }, documentKey } = event;

                        let target = this.items.find((item) => {
                            //return String(item._id) === String(event.documentKey._id);
                            return String(item._id) === String(documentKey._id);
                        });

                        // skip if nothing found
                        if (!target) {
                            return;
                        }

                        // get original property descriptor
                        //let descriptor = Object.getOwnPropertyDescriptors(target);

                        // NOTE use: extend(target, fullDocument);?!
                        //Object.assign(target, updatedFields);
                        _merge(target, updatedFields);

                        // override existing properties
                        //Object.defineProperties(target, descriptor);

                        // feedback
                        this.logger.debug(`Updated item object (${target._id}) due to changes in the collection`);

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

        /**
         * @function add
         * Adds a new item that matches the component schema
         * 
         * @param {Object} data Object that matches the component schema
         * @param {Object} options Options object
         * @param {Boolean} [options.returnDuplicate=true] When a duplicate is detected, return the already existing item instance?
         */
        this._defineMethod("add", (final) => {

            final((item) => {
                //this.items.push(item);
                items.push(item);
                return Promise.resolve();
            });

            return (data) => {
                return new Promise((resolve, reject) => {

                    let options = Object.assign({
                        returnDuplicate: true
                    }, {});

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

                    // override string with ObjectId, see #175
                    result.value._id = new mongodb.ObjectId(result.value._id);

                    this.collection.insertOne(result.value, (err, result) => {
                        if (err) {
                            if (err.code === 11000 && options.returnDuplicate) {

                                // 11000 = duplicate key
                                // search for object in .items and return it

                                let item = this.items.find((item) => {

                                    return Object.keys(err.keyValue).every((value) => {
                                        return item[value] === err.keyValue[value];
                                    });

                                    /*
                                    for (let key in err.keyValue) {
                                        console.log("Search in add data for", key)
                                        // change to or statement?
                                        return (item[key] && item[key] == (err.keyValue[key] || null));
                                    }
                                    */
                                });

                                if (item) {
                                    resolve([item]);
                                } else {
                                    reject(new Error(`Duplicate unique key/index in database, but no matching item`));
                                }

                            } else {

                                reject(err);

                            }
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


        /**
         * @function get
         * Returns a item that matches the <_id> property
         * 
         * @param {String} _id Item ObjectId as string (<._id>)
         */
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


        /**
         * @function remove
         * Removes a item from the database and the `.items` array
         *
         * @param {String} _id Removes item with matching ObjectId as string (<._id>)
         */
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
                        _id: new mongodb.ObjectId(_id)
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


        /**
         * @function update
         * Updates a existing item in the database  & `.items` array
         * 
         * @param {String} _id Item ObjectId as string (<._id>)
         * @param {Object} data Partial object properties to update item
         */
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

                    if (validation.error) {
                        return reject(validation.error);
                    }

                    // when validation is correct, assign the original property descriptors
                    // if not, this breaks custom setter/getter
                    // NOTE: Works only when DATABASE_WATCH_CHANGES=false
                    let descriptor = Object.getOwnPropertyDescriptors(target);
                    Object.defineProperties(validation.value, descriptor);

                    // _id is immutable. remove it
                    delete validation.value._id;

                    this.collection.findOneAndUpdate({
                        // casting problem, see #175
                        _id: new mongodb.ObjectId(_id)
                        //_id
                    }, {
                        $set: validation.value
                    }, {
                        //returnOriginal: false
                        //returnDocument: "after",
                        //upsert: true
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


        /**
         * @function find
         * Find matching item with key/values 
         * 
         * @param {Object} query key/value pair to search for in `.items` array
         */
        this._defineMethod("find", () => {
            return (query) => {
                return new Promise((resolve, reject) => {

                    // https://javascript.plainenglish.io/4-ways-to-compare-objects-in-javascript-97fe9b2a949c
                    // https://stackoverflow.com/a/1068883/5781499
                    // https://dmitripavlutin.com/how-to-compare-objects-in-javascript/

                    let item = this.items.find((item) => {
                        // for (let key of query) { ?!
                        for (let key in Object.keys(query)) {

                            if (query[key] === item[key]) {
                                return true;
                            } else {
                                return false;
                            }

                        }
                    });

                    if (!item) {
                        return reject(new Error("NOT_FOUND"), query);
                    }

                    resolve([item]);

                });
            };
        });

    }


    /**
    * @function found
    * A dynamic function which is called when either a item with matching filter is found in items array, 
    * or a new item with matching filter is added.
    * 
    * Arrays as filter arguments are currently ignored and invalidate the query.
    * As result, the function would not returny any items. Remove the array.
    * 
    * NOTE: The filter values are case sensetive!
    * 
    * @param {Object} filter Object that matches the component schema
    * @param {Function} cb Callback function
    * @param {Function} [nothing] Function that is called when not matching item in <items> array is found. Usefull to add then something, when its not found.
    */
    found(filter, cb, nothing) {

        let matched = false;

        let handler = (filter, input) => {

            let found = false;

            let loop = (filter, target) => {
                for (let key in filter) {

                    if (typeof filter[key] === "object") {
                        loop(filter[key], target[key]);
                        return;
                    }

                    // ignore non existing property on target & set result to false
                    if (!target || !Object.hasOwnProperty.call(target, key)) {
                        found = false;
                        return;
                    }

                    if (filter[key] === target[key]) {
                        found = true;
                    } else {
                        found = false;
                        return;
                    }

                }
            };

            // start loop
            loop(filter, input);

            if (found) {
                matched = true;
                cb(input);
            }

        };

        this.items.forEach((item) => {
            handler(filter, item);
        });

        if (!matched && nothing instanceof Function) {
            process.nextTick(() => {
                nothing(filter);
            });
        }

        // NOTE: Why is a array from the add eventlistener returned?!
        let ev = ([item]) => {
            handler(filter, item);
        };

        // TODO: Ensure to no create a memory leak
        // E.g. When used in ssdp with "update" event
        // And the announcement timestamp gets updated
        // the function is triggerd again. How to prevent that?
        // One solution could be to update that with hidden methods like $update
        // that do not emit events or the hook chain.
        this.events.on("add", ev);
        //this.events.on("update", ev);

        // return cleanup function
        return () => {
            this.events.removeListener("add", ev);
            //this.events.removeListener("update", ev);
        };

    }


    // 
    /*
        _exportItemMethod(name, prop) {
            this._defineMethod(name, () => {
    
                return (_id, ...args) => {
    
                    // _promisify(() => {}, args.pop()); ?!
    
                    return new Promise((resolve, reject) => {
    
                        let target = this.items.find((item) => {
                            return item._id === _id;
                        });
    
                        if (!target) {
                            reject(new Error(`Item with _id "${_id}" not found`));
                            return;
                        }
    
                        if (target[prop] instanceof Function) {
                            target[prop].apply(target, args);
                        }
    
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