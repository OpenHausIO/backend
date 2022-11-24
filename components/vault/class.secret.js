const mongodb = require("mongodb");
const Joi = require("joi");

const encrypt = require("./encrypt.js");
const decrypt = require("./decrypt.js");

// https://stackoverflow.com/a/53573115/5781499
// https://www.tutorialspoint.com/encrypt-and-decrypt-data-in-nodejs
// https://stackoverflow.com/q/70093261/5781499

/**
 * @description
 * Represents a single secret that wraps encrypt/decrypt methods
 * 
 * @class Secret
 * 
 * @param {Object} obj Object that matches the item schema. See properties below:
 * @param {Function} [changed] Optional callback that is fired when the value changed (Interal use only!)
 * 
 * @property {String} _id MongoDB Object id is as string
 * @property {String} name Human readable name
 * @property {String} [description=null] Description of the secret
 * @property {String} key Simple machine readable key. E.g.: ```PASSWORD``` or ```TOKEN```
 * @property {String} value Value for the key field. E.g: ```Pa$$w0rd``` or ```eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c```
 */
class Secret {

    constructor(obj, changed = () => { }) {

        Object.assign(this, obj);
        this._id = String(obj._id);

        Object.defineProperty(this, "value", {
            set(value) {

                // check if value is allready encrypted
                if (value?.split(":")?.length === 1) {
                    value = encrypt(value);
                }

                // ignore usless set
                // related to #219
                if (value == obj.value) {
                    return;
                }

                obj.value = value;

                process.nextTick(changed);

            },
            get() {
                return obj.value;
            },
            // NOTE: Make value field not enumarble?
            configurable: false
        });

    }


    /**
     * @function schema
     * Returns joi schema for a single secret
     * 
     * @static
     * 
     * @returns {Object} Joi.object
     */
    static schema() {
        return Joi.object({
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return String(new mongodb.ObjectId());
            }),
            name: Joi.string().required(),
            description: Joi.string().allow(null).default(null),
            key: Joi.string().required(),
            value: Joi.string().allow(null).default(null)
        });
    }


    /**
     * @function encrypt
     * Sets & encrypt the value for this secret
     * 
     * @param {String} text Input value to be encrypted
     * @returns {String} Ecnrypted string
     */
    encrypt(text) {
        this.value = encrypt(text);
    }


    /**
     * @function decrypt
     * Returns & decrypt the setted value
     *  
     * @returns {String} Decrypted string
     */
    decrypt() {
        return decrypt(this.value);
    }

}


module.exports = Secret;