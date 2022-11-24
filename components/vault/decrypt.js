const crypto = require("crypto");

/**
 * @function decrypt
 * Interal function that handels the decryption
 * 
 * @internal
 * 
 * @param {String} value Encrypted string
 * @returns {String} Decrypted string
 */
function decrypt(value) {

    let [ivs, salts, data] = value.split(":");
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

module.exports = decrypt;