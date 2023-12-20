module.exports = class Item {

    constructor(obj) {

        Object.assign(this, obj);

        // override properties
        this._id = String(obj._id);

        // create here class.label.js instance
        // see issue https://github.com/OpenHausIO/backend/issues/352
        // this.labels = obj.labels.map(...);

    }

};