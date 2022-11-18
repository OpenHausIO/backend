const mongodb = require("mongodb");
const Joi = require("joi");

//const logger = require("../../system/logger").create("vault");
//const COMMON_COMPONENT = require("../../system/component/common.js");
const COMPONENT = require("../../system/component/class.component.js");

const Vault = require("./class.vault.js");
const Secret = require("./class.secret.js");

/**
 * @description
 * Vault component to handle secrets, credentials & tokens.<br />
 * This is used to store encrypted access data for gateways/APIs.<br />
 * Use this if a API needs to be authenticated.<br />
 *  
 * @class C_VAULT
 * @extends COMPONENT system/component/class.component.js
 *  
 * @example 
 * ```js
 * const C_VAULT = require(".../components/vault");
 * 
 * C_VAULT.events.on("add", (item) => {
 *   console.log("New vault/secret added", item)
 * });
 * ```
 * 
 * @see secret components/vault/class.secret.js
 */
class C_VAULT extends COMPONENT {

    constructor() {

        // inject logger, collection and schema object
        super("vault", {
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return String(new mongodb.ObjectId());
            }),
            name: Joi.string().required(),
            identifier: Joi.string().required(),
            secrets: Joi.array().items(Secret.schema()).default([])
        }, module);

        this.hooks.post("add", (data, next) => {
            next(null, new Vault(data, this));
        });

    }

}


// create component instance
const instance = module.exports = new C_VAULT();


// init component
// set items/build cache
instance.init((scope, ready) => {

    if (!process.env.VAULT_MASTER_PASSWORD) {
        return ready(new Error("You need to set a `VAULT_MASTER_PASSWORD` environment variable!"));
    }

    scope.collection.find({}).toArray((err, data) => {
        if (err) {

            // shit...
            ready(err);

        } else {

            data = data.map((obj) => {
                return new Vault(obj, scope);
            });

            scope.items.push(...data);

            // init done
            ready(null);

        }
    });

});