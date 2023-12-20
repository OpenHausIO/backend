const Item = require("../../system/component/class.item.js");

/**
 * @description
 * Represents a room item
 * 
 * @class Room
 * 
 * @param {Object} obj Object that matches the item schema. See properties below:
 * 
 * @property {String} _id MongoDB Object is as string
 * @property {Number} [number=null] Room number
 * @property {Number} [floor=null] Floor on which the room is located
 * @property {String} [icon=null] fontawesome class string for the frontend
 */
module.exports = class Room extends Item {

    constructor(obj) {

        super(obj);

        // removed for #356
        //Object.assign(this, obj);
        //this._id = String(obj._id);

    }

};