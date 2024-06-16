const Joi = require("joi");

const Labels = require("./class.labels.js");
const Label = require("./class.label.js");

module.exports = class Item {

    constructor(obj) {

        Object.assign(this, obj);

        // override properties
        this._id = String(obj._id);

        // create here class.label.js instance
        // see issue https://github.com/OpenHausIO/backend/issues/352
        // this.labels = obj.labels.map(...);

        obj.labels?.forEach((txt, i, arr) => {
            if (!(txt instanceof Label)) {
                arr[i] = new Label(txt);
            }
        });

        let labels = new Labels(...obj.labels || []);

        Object.defineProperty(this, "labels", {
            get() {

                //console.log("get called");
                return labels;

            },
            set(value) {

                // clear array
                // needed when new array has fewer items than old one
                // otherwise it contains old items & has wrong size
                labels.splice(0, labels.length);

                value.forEach((txt, i) => {
                    if (!(txt instanceof Label)) {
                        labels[i] = new Label(txt);
                    } else {
                        labels[i] = txt;
                    }
                });

            },
            enumerable: true,
            configurable: false
        });

    }

    static schema() {
        return Joi.object({
            labels: Joi.array().items(Joi.alternatives().try(
                Joi.string().regex(/^.+?=.+|.+=.+$/i),
                Joi.object().custom((value, helpers) => {
                    if (value instanceof Label) {

                        // convert to string
                        // otherwise the serialized object is saved into the database
                        return value.toString();

                    } else {

                        return helpers.error("any.custom");

                    }
                }, "Instance of class.label.js")
            )).default([]),
            timestamps: Joi.object({
                created: Joi.number().allow(null).default(null),
                updated: Joi.number().allow(null).default(null)
            })
        });
    }

    static validate(data) {
        return Item.schema().validate(data);
    }

};