module.exports = class Params extends Array {

    constructor(...args) {
        super(...args);
    }

    lean() {
        return this.reduce((obj, { key, value }) => {
            obj[key] = value;
            return obj;
        }, {});
    }

};