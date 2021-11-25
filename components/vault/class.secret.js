const crypto = require("crypto");

// https://stackoverflow.com/a/53573115/5781499
// https://www.tutorialspoint.com/encrypt-and-decrypt-data-in-nodejs
// https://stackoverflow.com/q/70093261/5781499

class Secret {

    constructor(obj) {

        Object.assign(this, obj);
        this._id = String(obj._id);

        this.fields = obj.fields.map((field) => {
            field._id = String(field._id);
            return field;
        });

    }

    _encrypt(text) {

        let iv = crypto.randomBytes(Number(process.env.VAULT_IV_BYTE_LEN));
        let salt = crypto.randomBytes(Number(process.env.VAULT_SALT_BYTE_LEN));
        let key = crypto.scryptSync(process.env.VAULT_MASTER_PASSWORD, salt, Number(process.env.VAULT_KEY_BYTE_LEN));

        let cipher = crypto.createCipheriv(process.env.VAULT_BLOCK_CIPHER, key, iv, {
            authTagLength: Number(process.env.VAULT_AUTH_TAG_BYTE_LEN)
        });
        let encrypted = cipher.update(text, "utf8", "hex");
        encrypted += cipher.final("hex");

        return `${iv.toString("hex")}:${salt.toString("hex")}:${encrypted}`;

    }

    _decrypt(text) {

        let [ivs, salts, data] = text.split(":");
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


    encrypt(data, cb) {
        try {

            let values = {};

            Object.keys(data).forEach((key) => {

                let target = this.fields.find((obj) => {
                    return obj.key === key;
                });

                if (!target) {
                    throw new Error(`Field key "${key}" not found in Secret "${this.name}"`);
                }

                values[key] = this._encrypt(data[key]);
                target.value = values[key];

            });

            cb(null, values);

        } catch (err) {
            cb(err);
        }
    }


    decrypt(cb) {
        try {

            let values = {};

            this.fields.forEach((field) => {
                values[field.key] = this._decrypt(field.value);
            });

            cb(null, values);

        } catch (err) {
            cb(err);
        }
    }


}


module.exports = Secret;