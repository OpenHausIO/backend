//const logger = require("../../system/logger").create("vault");
//const COMMON_COMPONENT = require("../../system/component/common.js");
const COMPONENT = require("../../system/component/class.component.js");

const Vault = require("./class.vault.js");

const encrypt = require("./encrypt.js");

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
        super("vault", Vault.schema(), [
            Vault
        ]);

        this.hooks.pre("add", (data, next) => {
            try {

                if (data?.secrets) {
                    data.secrets = data.secrets.map((secret) => {

                        if (secret.value) {
                            secret.value = encrypt(secret.value);
                        }

                        return secret;

                    });
                }

                next(null);

            } catch (err) {
                next(err);
            }
        });

        this.hooks.post("add", (data, next) => {
            next(null, new Vault(data));
        });

        /*
        // investigation of #208
        this.hooks.post("update", (data, next) => {

            console.log("update post:", data);

            let valid = data.secrets.every((secret) => {
                return secret instanceof Secret;
            });

            console.log("Secrets instances valid:", valid, data.secrets)

            if (!valid) {
                //_merge(item, new Vault(data, this));
                //Object.assign(data, new Vault(data, this));
            }

            next(null);

        });
        */

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
                return new Vault(obj);
            });

            scope.items.push(...data);

            // init done
            ready(null);

        }
    });

});