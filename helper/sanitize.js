// https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html

const RULES = [
    { char: "&", value: "&amp;" },
    { char: "<", value: "&lt;" },
    { char: ">", value: "&gt;" },
    { char: '"', value: "&quot;" },
    { char: "'", value: "&#x27;" },
    { char: "/", value: "&#x2F;" },
    { char: "`", value: "&grave;" },
    //{ char: "$", value: "&#x24;" } npm test fails with this enabled... Why?!
];


/**
 * @function encode
 * Encode/replace a string 
 *  
 * @param {String} str String to encode
 * @param {Array} rules Additional array of rules to apply
 * 
 * @returns {String} Returns the encoded string
 * 
 * @example
 * ```js * 
 * const { encode } = require(".../helper/sanitize");
 * 
 * encode("<harmful> ../../etc/passwd string"); // &lt;harmful&gt; ..&#x2F;..&#x2F;etc&#x2F;passwd string
 * ```
 */
function encode(str, rules = []) {
    return [
        ...RULES,
        ...rules
    ].reduce((cur, prev) => {

        let regex = new RegExp(prev.char, "gi");
        return cur.replace(regex, prev.value);

    }, str).trim();
}

/**
 * @function decode
 * Decode a encoded string
 *  
 * @param {String} str Input string
 * @param {Array} rules Additional array of rules to apply
 * 
 * @returns {String} Returns the decoded string
 * 
 * @example
 * ```js
 * const { decode } = require(".../helper/sanitize");
 * 
 * decode("&gt; Hello World &lt;"); // > Hello World <
 * ```
 */
function decode(str, rules = []) {
    return [
        ...RULES,
        ...rules
    ].reduce((cur, prev) => {

        let regex = new RegExp(prev.value, "gi");
        return cur.replace(regex, prev.char);

    }, str).trim();
}

module.exports = {
    encode,
    decode,
    RULES
};