module.exports = class Label {

    constructor(label) {

        let [key, value] = label.split("=");

        Object.defineProperty(this, "key", {
            set(val) {
                key = val;
                label = `${key}=${value}`;
            },
            get() {
                return key;
            },
            enumerable: true
        });

        Object.defineProperty(this, "value", {
            set(val) {
                value = val;
                label = `${key}=${value}`;
            },
            get() {
                return value;
            },
            enumerable: true
        });

        Object.defineProperty(this, "label", {
            set(val) {
                let { k, v } = label.split("=");
                label = val;
                key = k;
                value = v;
            },
            get() {
                return label;
            },
            enumerable: true
        });

    }

    toJSON() {
        return `${this.key}=${this.value}`;
    }

    toString() {
        return `${this.key}=${this.value}`;
    }

};