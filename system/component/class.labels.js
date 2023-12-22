module.exports = class Labels extends Array {

    constructor(...args) {
        super(...args);
    }

    value(key) {
        return this.find((label) => {
            return label.key === key;
        })?.value;
    }

    key(value) {
        return this.find((label) => {
            return label.value === value;
        })?.key;
    }

    has(key) {
        return !!this.find((label) => {
            return label.key === key;
        });
    }

    filter(query) {

        let [k, v] = query.split("=");

        return Array.prototype.filter.call(this, (label) => {

            if (k !== "*") {
                return label.key === k;
            }

            if (v !== "*") {
                return label.value === v;
            }

            return label.key === k && label.value === v;

        });

    }

    toJSON() {
        return this.map(({ key, value }) => {
            return `${key}=${value}`;
        });
    }

};