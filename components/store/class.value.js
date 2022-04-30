/**
 * @description
 * Represents a single key/value item.
 * 
 * @class Value
 * 
 * @param {Object} obj Object that matches the item schema. See properties below:
 * 
 * @property {String} _id MongoDB Object id is as string
 * @property {String} key Object key, like in a regular object
 * @property {Any} value Value of the property <ke>
 * @property {String} description Description for what the key is used
 * @property {String} namespace Object namespace, `uuid -v4`
 */
class Value {
    constructor(obj) {

        Object.assign(this, obj);
        this._id = String(obj._id);

    }
}

module.exports = Value;