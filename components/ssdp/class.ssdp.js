class SSDP {
    constructor(obj) {

        Object.assign(this, obj);
        this._id = String(obj._id);

    }
}

module.exports = SSDP;