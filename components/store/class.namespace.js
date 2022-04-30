/**
 * @description
 * Collects all items with the same namespace and handle them like they were stored on the same object.<br />
 * Just like a regular javascript object.<br />
 * The values are wrapped in custom setter/getter to keep things updated in the database.
 * 
 * @class Namepsace
 * 
 * @example 
 * ```js
 * const C_STORE = require(".../components/store");
 * 
 * // a namespace contains all properties that have been stored with the uuid
 * const settings = C_STORE.namespace("4b564aab-ff4d-42b9-b15b-38885d4a0613");
 * 
 * console.log(settings.poll_interval) // 6000
 * 
 * // update the value (synct to database)
 * settings.poll_interval = 3000;
 * ```
 * 
 * @example
 * ```js
 * {
 *   poll_interval: 3000,
 *   ...
 * }
 * ```
 */
class Namespace {
    constructor(namespace, scope) {

        Object.defineProperty(this, "__namespace", {
            value: namespace,
            configurable: false,
            enumerable: false,
            writable: false
        });

        scope.items.filter((obj) => {
            return obj.namespace === namespace;
        }).forEach((obj) => {
            // TODO: Handly asynchron setter correct
            // https://medium.com/trabe/async-getters-and-setters-is-it-possible-c18759b6f7e4
            Reflect.defineProperty(this, obj.key, {
                set: (value) => {
                    // eslint-disable-next-line no-setter-return
                    return new Promise((resolve, reject) => {

                        // update value in database
                        scope.collection.updateOne({
                            namespace,
                            key: obj.key
                        }, {
                            $set: {
                                value,
                                timestamps: {
                                    created: obj.timestamps.created,
                                    updated: Date.now()
                                }
                            }
                        }, (err, { result }) => {
                            if (err) {

                                scope.logger.warn(`Could not update value for namespace/key (${namespace}/${obj.key}):`, err.message);
                                reject(err);

                            } else {

                                // update value
                                obj.value = value;

                                if (result.n === 1 && result.nModified === 1) {
                                    scope.logger.verbose(`Key/Value for namespace (${namespace}) updated: ${obj.key} = ${value}`);
                                }

                                resolve(true);

                            }
                        });
                    });
                },
                get: () => {
                    return obj.value;
                },
                configurable: true,
                enumerable: true
            });
        });

    }
}

module.exports = Namespace;