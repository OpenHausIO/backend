const jwt = require("jsonwebtoken");

const _promisify = require("../../helper/promisify");

/**
 * @description
 * Represents a user item
 * 
 * @class User
 * 
 * @param {Object} scope C_USERS component instance (<this> scope)
 * @param {Object} obj Object that matches the item schema. See properties below:
 * 
 * @property {String} _id MongoDB Object is as string
 * @property {String} name User name (Human friendly name/real name)
 * @property {String} email User E-Mail Address
 * @property {String} password Password for logins
 * @property {Boolean} [enabled=false] Is user enabled/can login?
 * @property {Array} tokens Internal used to store JWTs (Active tokens/sessions)
 */
module.exports = class User {

    constructor(scope, obj) {

        Object.assign(this, obj);
        this._id = String(obj._id);

        Object.defineProperty(this, "_scope", {
            value: scope,
            writable: false,
            enumerable: false,
            configurable: false
        });

    }

    /**
     * @function addToken
     * Adds a new JWT token for the user.
     * The token can be used for authentication.
     *
     * @param {Function} [cb] Optional callback
     * @returns {Promise} If no callback is provided
     */
    addToken(cb) {
        return _promisify((done) => {
            jwt.sign({
                email: this.email,
                uuid: process.env.UUID
            }, process.env.USERS_JWT_SECRET, {
                algorithm: process.env.USERS_JWT_ALGORITHM
            }, (err, token) => {
                if (err) {

                    done(err);

                } else {

                    this.tokens.push(token);

                    this._scope.update(this._id, this, (err, data) => {
                        if (err) {
                            done(err);
                        } else {

                            this._scope.logger.verbose(`Token for user "${this.name}" (${this._id}) added.`);

                            done(null, token, data);

                        }
                    });

                }
            });
        }, cb);
    }

    /**
     * @function removeToken
     * Removes a token from the user.
     * If the token is removed, it can not be longer used for authentication
     * 
     * @param {String} token Token to be removed
     * @param {Function} [cb] Optional callback
     * @returns {Promise} If no callback is provided
     */
    removeToken(token, cb) {
        return _promisify((done) => {

            let index = this.tokens.findIndex((jwt) => {
                return token === jwt;
            });

            if (index === -1) {
                done(null, this);
                return;
            }

            this.tokens.splice(index, 1);

            this._scope.update(this._id, this, (err, result) => {
                if (err) {
                    done(err);
                } else {

                    this._scope.logger.verbose(`Token from user "${this.name}" (${this._id}) removed.`);

                    done(null, result);

                }
            });

        }, cb);
    }

};