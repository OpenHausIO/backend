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

        let [k, v] = query.split(/=(.+)/);

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

    includes(str) {
        return Array.prototype.includes.call(this.toJSON(), str);
    }


    static deserialize(labels) {

        let result = {};

        labels.forEach((label) => {

            let [path, value] = label.split(/=(.+)/);
            let parts = path.split(".");
            let current = result;

            for (let i = 0; i < parts.length; i++) {

                let key = parts[i];
                //let isLast = (i === parts.length - 1);
                let isArray = key.endsWith("[]");

                if (isArray) {
                    key = key.slice(0, -2);
                }

                //if (isLast) {
                if (i === parts.length - 1) {
                    if (isArray) {

                        if (!current[key]) {
                            current[key] = [];
                        }

                        current[key].push(value);

                    } else {

                        current[key] = value;

                    }
                } else {

                    if (!current[key]) {
                        current[key] = {};
                    }

                    current = current[key];

                }

            }

        });

        return result;

    }

    static serialize(obj, prefix = "") {

        let result = [];

        for (let key in obj) {
            let value = obj[key];
            let newKey = prefix ? `${prefix}.${key}` : key;

            if (typeof value === "object" && !Array.isArray(value)) {
                result = result.concat(Labels.serialize(value, newKey));
            } else if (Array.isArray(value)) {
                value.forEach(val => {
                    result.push(`${newKey}[]=${val}`);
                });
            } else {
                result.push(`${newKey}=${value}`);
            }
        }

        return result;

    }

};