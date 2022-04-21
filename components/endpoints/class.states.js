const State = require("./class.state.js");

/**
 * @description
 * Houses <State> classes, just like a regular array, with custom methods to set values
 * 
 * @class States
 * @extends Array
 * 
 * @param {Array} arr Command objects
 */
module.exports = class States extends Array {

    constructor(arr) {

        super();


        // without this, <this>.map throws type error:
        // TypeError: items.forEach is not a function
        // <items> is when map function is called a number
        if (arr instanceof Array) {
            arr.forEach((obj) => {
                this.push(new State(obj));
            });
        }

    }

    /**
     * @function setValue
     * Set the value of a state object
     *
     * @param {String} _id Monogdb ObjectID as String
     * @param {String,Number,Boolean} value Value to set
     * @param {Function} cb Callback
     * 
     * @example 
     * ```js
     * const C_ENDPOINTS = require(".../components/endpoints");
     * 
     * C_ENDPOINTS.find({
     *   name: "TV"
     * }, (err, endpoint) => {
     *   
     *   console.log(err || endpoint);
     *   
     *   const {states} = endpoints;
     *   const {setValue} = states;
     * 
     * });
     * ```
     * 
     * @example
     * ```js
     * setValue("62557f6b54e3795531b5fc06", 10, (err) => {
     *   console.log(err || "Value set!");
     * });
     * ```
     * 
     * @example
     * ```js
     * setValue("62557f904b99bb2d0172ee53", "SRC_HDMI1", (err) => {
     *   console.log(err || "Value set!");
     * });
     * ```
     * 
     * @example
     * ```js
     * setValue("62557fbd1956de67da6cf9e7", true, (err) => {
     *   console.log(err || "Endpoint power state set to: on");
     * });
     * ```
     */
    setValue(_id, value, cb) {

        let target = this.find((obj) => {
            return _id === obj._id;
        });

        if (!target) {
            cb(new Error(`Item with _id "${_id}" not found`));
        }

        target.value = value;

    }

};