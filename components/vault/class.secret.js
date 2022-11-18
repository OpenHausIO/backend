const crypto = require("crypto");
const mongodb = require("mongodb");
const Joi = require("joi");

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

        let iv = crypto.randomBytes(Number(process.env.VAULT_IV_BYTE_LEN));
        let salt = crypto.randomBytes(Number(process.env.VAULT_SALT_BYTE_LEN));
        let key = crypto.scryptSync(process.env.VAULT_MASTER_PASSWORD, salt, Number(process.env.VAULT_KEY_BYTE_LEN));

        let cipher = crypto.createCipheriv(process.env.VAULT_BLOCK_CIPHER, key, iv, {
            authTagLength: Number(process.env.VAULT_AUTH_TAG_BYTE_LEN)
        });

        let encrypted = cipher.update(text, "utf8", "hex");
        encrypted += cipher.final("hex");

        return this.value = `${iv.toString("hex")}:${salt.toString("hex")}:${encrypted}`;

    }


    /**
     * @function decrypt
     * Returns & decrypt the setted value
     *  
     * @returns {String} Decrypted string
     */
    decrypt() {

        let [ivs, salts, data] = this.value.split(":");
        let iv = Buffer.from(ivs, "hex");
        let salt = Buffer.from(salts, "hex");
        let key = crypto.scryptSync(process.env.VAULT_MASTER_PASSWORD, salt, Number(process.env.VAULT_KEY_BYTE_LEN));

        let decipher = crypto.createDecipheriv(process.env.VAULT_BLOCK_CIPHER, key, iv, {
            authTagLength: Number(process.env.VAULT_AUTH_TAG_BYTE_LEN)
        });

        let decrypted = decipher.update(data, "hex", "utf8");
        decrypted += decipher.final("utf8");

        return decrypted.toString();

    }

}


module.exports = Secret;