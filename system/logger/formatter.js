const dateFormat = require("dateformat").default;
const safe = require("colors/safe");

const levels = require("./levels.js");

/**
 * @function format
 * Formats a logger record
 * 
 * @param {Object} rec Logging record
 * 
 * @returns {String} Formatted message
 */
module.exports = (rec) => {

    let methods = levels.colors[rec.level].split(",");

    // chain color methods
    let colorize = methods.reduce((prev, cur) => {
        return prev[cur.trim()];
    }, safe);

    //let colorize = safe[levels.colors[rec.level]];
    let timestamp = dateFormat(rec.time, process.env.LOG_DATEFORMAT);

    // build message string
    let msg = `[${colorize(timestamp)}]`;
    msg += `[${colorize(rec.level)}]`;
    msg += `[${colorize(rec.name)}]`;
    msg += ` ${rec.message}`;

    return msg;

};