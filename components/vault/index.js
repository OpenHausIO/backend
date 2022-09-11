const mongodb = require("mongodb");
const Joi = require("joi");

//const logger = require("../../system/logger").create("vault");
//const COMMON_COMPONENT = require("../../system/component/common.js");
const COMPONENT = require("../../system/component/class.component.js");

const _promisify = require("../../helper/promisify");

const Secret = require("./class.secret.js");

/**
 * @description
 * Vault component to handle secrets, credentials & tokens.<br />
 * This is used to store encrypted access data for gateways/APIs.<br />
 * Use this if a API needs to be authenticated.<br />
 *  
 * @class C_VAULT
 * @extends COMPONENT system/component/class.component.js
 * 
 * @example 
 * ```js
 * const C_VAULT = require(".../components/vault");
 * 
 * C_VAULT.decrypt("FRITZBOX", (err, fields) => {
 *   console.log(err, fields);
 * });
 * ```
 * 
 * @example 
 * ```js
 * const C_VAULT = require(".../components/vault");
 * 
 * C_VAULT.events.on("add", (item) => {
 *   console.log("New vault/secret added", item)
 * });
 * ```
 */
class C_VAULT extends COMPONENT {

    constructor() {

        // inject logger, collection and schema object
        super("vault", {
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return String(new mongodb.ObjectID());
            }),
            name: Joi.string().required(),
            identifier: Joi.string().required(),
            fields: Joi.array().items({
                _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                    return new mongodb.ObjectID();
                }),
                name: Joi.string().required(),
                description: Joi.string().allow(null).default(null),
                key: Joi.string().required(),
                value: Joi.string().allow(null).default(null)
            }).default([])
            //keywords: Joi.array().items(Joi.string()).default([]) ? usefull ->?
        }, module);

        this.hooks.post("add", (data, next) => {
            next(null, new Secret(data));
        });

    }


    /**
     * @function encrypt
     * Encrypt a vault
     * 
     * @param {String} identifier 
     * @param {Array} fields 
     * 
     * @returns {Function} cb 
     */
    encrypt(identifier, fields, cb) {
        return _promisify((done) => {

            let target = this.items.find((obj) => {
                return (identifier === obj.identifier) || (identifier === obj._id);
            });

            if (!target) {
                done(new Error("NOT_FOUND"));
                return;
            }


            // encrypt secret
            target.encrypt(fields, (err, encrypted) => {
                if (err) {

                    done(err);

                } else {

                    let fields = target.fields.map((field) => {

                        // update only field that we re-encrypted
                        // else return the original field
                        if (field.key in encrypted) {
                            field.value = encrypted[field.key];
                        }

                        return field;

                    });

                    this.update(String(target._id), {
                        fields
                    }, (err) => {

                        if (err) {
                            done(err);
                        } else {
                            done(null, fields);
                        }

                    });

                }
            });

        }, cb);
    }


    /**
     * @function decrypt
     * 
     * Decrypt a vault
     * 
     * @param {String} identifier 
     * @param {Function} cb Callback
     * 
     * @returns  {Function} cb 
     */
    decrypt(identifier, cb) {
        return _promisify((done) => {

            let target = this.items.find((obj) => {
                return (identifier === obj.identifier) || (identifier === obj._id);
            });

            if (!target) {
                done(new Error("NOT_FOUND"));
            }

            target.decrypt(done);

        }, cb);
    }


}


// create component instance
const instance = module.exports = new C_VAULT();


// init component
// set items/build cache
instance.init((scope, ready) => {

    if (process.env.VAULT_MASTER_PASSWORD.length <= 0) {
        return ready(new Error("You need to set a `VAULT_MASTER_PASSWORD` environment variable!"));
    }

    scope.collection.find({}).toArray((err, data) => {
        if (err) {

            // shit...
            ready(err);

        } else {

            data = data.map((obj) => {
                return new Secret(obj);
            });

            scope.items.push(...data);

            // init done
            ready(null);

        }
    });

});