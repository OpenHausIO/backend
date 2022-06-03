// external modules
const mongodb = require("mongodb");
const Joi = require("joi");
const bcrypt = require("bcrypt");

// system stuff
const { COMPONENT } = require("../../system/component");

// helper
const _promsify = require("../../helper/promisify");

// local files
const User = require("./class.user.js");

/**
 * @description
 * Manages users, handle accounts, hash/compares passwords.<br />
 * All stuff that a user component should do ;)
 * 
 * @class C_USERS
 * @extends COMPONENT system/component/class.component.js
 * 
 */
class C_USERS extends COMPONENT {
    constructor() {

        // inject logger, collection and schema object
        super("users", {
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return new mongodb.ObjectID();
            }),
            name: Joi.string().required(),
            email: Joi.string().required(),
            password: Joi.string().required(),
            enabled: Joi.boolean().default(false),
            tokens: Joi.array().items(Joi.string()).default([]),
            timestamps: {
                //would be greate to have a expiration date for users
                //expires: Joi.number().allow(null).default(null)
                login: Joi.number().allow(null).default(null),
                logout: Joi.number().allow(null).default(null)
            }
        }, module);

        this.hooks.post("add", (data, next) => {
            next(null, new User(this, data));
        });

        this.hooks.pre(["add", "update"], (_id, data, next) => {

            // if next is missing & only 2 arguments passed
            // this is a update call, override arguments
            if (data instanceof Function && !next) {
                next = data;
                data = _id;
                _id = null;
            }

            // if password is set, but not a bcrypt string hash it
            // if it matches the regex, its allready a bcrypt string, then do nothing
            if (data?.password && !(new RegExp(/^\$2[ayb]\$.{56}$/, "gi")).test(data.password)) {
                bcrypt.hash(data.password, Number(process.env.USERS_BCRYPT_SALT_ROUNDS), (err, hash) => {
                    if (err) {

                        this.logger.warn(err, "Could not hash password");
                        next(err);

                    } else {

                        data.password = hash;

                        if (!_id) {
                            next(null, data);
                        } else {
                            next(null, _id, data);
                        }

                    }
                });
            } else {
                next();
            }

        });

        this.collection.createIndex("email", {
            unique: true
        });

        // map methods from user item to component
        this._mapMethod("addToken", "addToken", this.items);
        this._mapMethod("removeToken", "removeToken", this.items);

    }


    /**
     * @function login
     * Takes username & password and compares these data with documents in the database.
     * If a user is found it compares the passwords with the hash and returns the user/valid boolean.
     * 
     * @param {String} email E-Mail address of the user
     * @param {String} pass Password of the user (plain text)
     * @param {Function} [cb] Optional callback function
     * @returns 
     */
    login(email, pass, cb) {
        return _promsify((done) => {

            this.logger.debug(`Login user "${email}"`);

            let user = this.items.find((user) => {
                return user.email === email;
            });

            if (!user) {
                this.logger.debug(`User not found "${email}"`);
                done(null, null);
                return;
            }

            if (!user.enabled) {
                this.logger.warn(`Disable user "${email}" login attempt`);
                done(null, null);
                return;
            }

            bcrypt.compare(pass, user.password, (err, valid) => {
                if (err) {

                    this.logger.error(err, `Could not compare password for user "${user.name}" (${user.email})`);
                    done(err);

                } else if (valid) {

                    this.update(user._id, {
                        tokens: [],
                        timestamps: {
                            login: Date.now()
                        }
                    }, (err) => {
                        if (err) {

                            done(err);

                        } else {

                            this.logger.info(`User "${user.name}" (${user.email}) successfull logged in`);
                            done(null, user);

                        }
                    });

                } else {

                    this.logger.warn(`Invalid login attempt from user "${user.name}" (${user.email})`);
                    done(null, false);

                }
            });

        }, cb);
    }

    /**
     * @function logout
     * Remove all created tokens from user item.
     * Thus, the user is not able to perform any api calls more (until a login is made again)
     * 
     * @param {String} email User E-Mail address
     * @param {Function} cb Callback function
     * @returns 
     */
    logout(email, cb) {
        return _promsify((done) => {

            this.logger.debug(`Logout user "${email}"`);

            let user = this.items.find((user) => {
                return user.email === email;
            });

            if (!user) {
                this.logger.warn(`User "${email}" not found for logging out`);
                done(null, null);
                return;
            }

            this.update(user._id, {
                tokens: [],
                timestamps: {
                    logout: Date.now()
                }
            }, (err) => {
                if (err) {

                    done(err);

                } else {

                    done(null, user, true);

                }
            });

        }, cb);
    }

}


// create component instance
const instance = module.exports = new C_USERS();


// init component
// set items/build cache
instance.init((scope, ready) => {

    if (process.env.USERS_JWT_SECRET <= 0) {
        return ready(new Error("You need to set a `USERS_JWT_SECRET` environment variable!"));
    }

    scope.collection.find({}).toArray((err, data) => {
        if (err) {

            // shit...
            ready(err);

        } else {

            data = data.map((obj) => {
                return new User(scope, obj);
            });

            scope.items.push(...data);

            // init done
            ready(null);

        }
    });

});