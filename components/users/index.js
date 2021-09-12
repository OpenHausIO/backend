const mongodb = require("mongodb");
const Joi = require("joi");
const bcrypt = require("bcrypt");


const logger = require("../../system/logger").create("users");
const COMMON_COMPONENT = require("../../system/component/common.js");

const promisify = require("../../helper/promisify");


class C_USERS extends COMMON_COMPONENT {

    constructor() {

        // inject logger, collection and schema object
        super(logger, mongodb.client.collection("users"), {
            name: Joi.string().required(),
            email: Joi.string().required(),
            password: Joi.string().required().min(Number(process.env.PASSWORD_MIN_LENGTH)),
            enabled: Joi.number().default(true)
        }, module);

        this.hooks.pre("add", (data, next) => {
            this._middlewareHashPassword(data, next);
        });

        // this breaks update mechanism
        // schema validation failes
        /*
        this.hooks.post("add", (obj, next) => {
            delete obj.password;
            next();
        });
        */

        this.hooks.pre("update", (_id, data, next) => {
            this._middlewareHashPassword(data, next);
        });


        // this breaks update mechanism
        // schema validation failes
        /*
        this.hooks.post("update", (obj, next) => {
            delete obj.password;
            next();
        });
        */

    };

    _middlewareHashPassword(data, next) {
        if (!data.password) {

            // ignore if there is no password
            next();

        } else {

            this.hashPassword(data.password, (err, hash) => {
                if (err) {

                    // if err is a instance of Error,
                    // middleware gets aborted
                    //TODO: set custom error here!
                    next(err);

                } else {

                    data.password = hash;
                    next();

                }
            });

        }
    }


    hashPassword(plain, cb) {
        return promisify((done) => {

            bcrypt.hash(plain, Number(process.env.BCRYPT_SALT_ROUNDS || 12), (err, hash) => {
                if (err) {

                    this.logger.warn(err, "Could not hash password");

                    done(err);

                } else {
                    done(null, hash);
                }
            });

        }, cb);
    }

};


// create component instance
const instance = module.exports = new C_USERS();


// init component
// set items/build cache
instance.init((scope, ready) => {
    scope.collection.find({}).toArray((err, data) => {
        if (err) {

            // shit...
            ready(err);

        } else {

            /*
            // breaks update mechanism
            // password is required
            data = data.map((obj) => {
                delete obj.password;
                return obj;
            });
            */

            scope.items.push(...data);

            // init done
            ready(null);

        }
    });
});