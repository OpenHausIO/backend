const Joi = require("joi");
const mongodb = require("mongodb");

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

    static schema() {
        return Joi.object({
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return String(new mongodb.ObjectId());
            }),
            name: Joi.string().required(),
            number: Joi.number().allow(null).default(null),
            floor: Joi.number().allow(null).default(null),
            icon: Joi.string().allow(null).default(null)
        });
    }

    static validate(data) {
        return Room.schema().validate(data);
    }

};