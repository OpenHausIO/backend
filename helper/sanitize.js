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

// NOTE use encode/decode-encodeURIComponent?

/**
 * 
 * @param {string} str 
 * @param {array} rules 
 * @returns 
 */
// NOTE Rename?`(serialize)
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
 * 
 * @param {string} str 
 * @param {array} rules 
 * @returns 
 */
// NOTE Rename?`(deserialize)
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