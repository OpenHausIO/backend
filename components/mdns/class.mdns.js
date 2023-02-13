class MDNS {

    constructor(obj) {

        Object.assign(this, obj);
        this._id = String(obj._id);

        Object.defineProperty(this, "_matches", {
            value: [],
            writable: false,
            configurable: false,
            enumerable: false
        });

    }

    match(cb) {
        this._matches.push(cb);
    }

}

module.exports = MDNS;