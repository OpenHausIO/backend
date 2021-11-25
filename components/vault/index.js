const mongodb = require("mongodb");
const Joi = require("joi");

const logger = require("../../system/logger").create("vault");
const COMMON_COMPONENT = require("../../system/component/common.js");

const _promisify = require("../../helper/promisify");

const Secret = require("./class.secret.js");

class C_VAULT extends COMMON_COMPONENT {

    constructor() {

        // inject logger, collection and schema object
        super(logger, mongodb.client.collection("vault"), {
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return new mongodb.ObjectID();
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
        }, module);

    }



    encrypt(identifier, fields, cb) {
        return _promisify((done) => {

            let target = this.items.find((obj) => {
                return (identifier === obj.identifier) || (identifier === obj._id);
            });

            if (!target) {
                done(new Error("NOT_FOUND"));
                return;
            }

            //FIXME handle null as property/key value to unset a value

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