module.exports = class Room {
    constructor(obj) {
        Object.assign(this, obj);
        this._id = String(obj._id);
    }
};