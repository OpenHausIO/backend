const crypto = require("crypto");

/**
 * @function encrypt
 * Interal function that handels the encrpytion
 * 
 * @internal
 * 
 * @param {String} value Vanilla string
 * @returns {String} Encrypted string
 */
function encrypt(text) {

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

module.exports = encrypt;