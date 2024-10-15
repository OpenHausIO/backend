const Joi = require("joi");
const mongodb = require("mongodb");

const { setTimeout } = require("timers/promises");

const Makro = require("./class.makro.js");
const Trigger = require("./class.trigger.js");

const Item = require("../../system/component/class.item.js");


module.exports = class Scene extends Item {

    constructor(obj) {

        super(obj);

        // removed for #356
        //Object.assign(this, obj);
        //this._id = String(obj._id);

        this.makros = obj.makros.map((makro) => {
            return new Makro(makro);
        });

        this.triggers = obj.triggers.map((data) => {

            let trigger = new Trigger(data);

            trigger.signal.on("fire", () => {
                this.trigger();
            });

            return trigger;

        });

        Object.defineProperty(this, "states", {
            value: {
                running: false,
                aborted: false,
                finished: false,
                index: 0
            },
            enumerable: false,
            configurable: false,
            writable: true
        });

        Object.defineProperty(this, "_ac", {
            value: null,
            enumerable: false,
            configurable: false,
            writable: true
        });


        // wrap timestamps in proxy set trap
        // update item in database when the timestamps
        // "started", "finished" or "aborted" set
        // this ensures that theay are not `null` after a restart
        this.timestamps = new Proxy(obj.timestamps, {
            set: (target, prop, value, receiver) => {

                let { update, logger } = Scene.scope;

                if (["started", "finished", "aborted"].includes(prop) && value !== target[prop]) {

                    // feedback
                    logger.trace(`Update timestamp: ${prop}=${value}`);

                    // cant use `async update()` here
                    // no clue why, if used, "started", "aborted", "finished"
                    // timestamps are not set correctly, only "updated" is set to current time
                    // Maybe because its affect the reflect synchron `Reflect.set(...)` below
                    update(this._id, this, (err) => {
                        if (err) {

                            // feedback
                            logger.warn(err, `Could not save timestamp ${prop}=${value}`);

                        } else {

                            // feedback
                            logger.debug(`Updated timestamps in database: ${prop}=${value}`);

                        }
                    });

                }

                return Reflect.set(target, prop, value, receiver);

            }
        });

    }

    static schema() {
        return Joi.object({
            _id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).default(() => {
                return String(new mongodb.ObjectId());
            }),
            name: Joi.string().required(),
            makros: Joi.array().items(Makro.schema()).default([]),
            triggers: Joi.array().items(Trigger.schema()).default([]),
            visible: Joi.boolean().default(true),
            icon: Joi.string().allow(null).default(null),
            timestamps: {
                started: Joi.number().allow(null).default(null),
                aborted: Joi.number().allow(null).default(null),
                finished: Joi.number().allow(null).default(null)
            }
        });
    }

    static validate(data) {
        return Scene.schema().validate(data);
    }

    trigger() {

        // fix #507
        // stop previous running scene
        if (this.states.running && this._ac) {
            this._ac.abort();
        }

        this.timestamps.started = Date.now();
        let ac = new AbortController();
        this._ac = ac;

        // wrap this in a custom method
        // that returns the state?
        // `getStates()` or so...
        this.states.running = true;
        this.states.aborted = false;
        this.states.finished = false;
        this.states.index = 0;

        let init = this.makros.filter(({

            // enabled is per default "true"
            // when a marko should be disabled
            // this has explicit to be set to false
            enabled = true

        }) => {

            // execute only enabled makros
            return enabled;

        }).map((makro) => {

            // bind scope to method
            return makro.execute.bind(makro);

        }).reduce((acc, cur, i) => {
            return (result) => {
                return acc(result, this._ac.signal).then(async (r) => {
                    if (this.states.aborted) {

                        return Promise.reject("Aborted!");

                    } else {

                        // NOTE: Intended to be a workaround for #329 & #312
                        // But the general idea of this is not bad
                        // TODO: Add abort signal
                        await setTimeout(Number(process.env.SCENES_MAKRO_DELAY));

                        // represents the current index of makro
                        // e.g. timer takes 90min to finish,
                        // index = timer makro in `makros` array
                        this.states.index = i;

                        return cur(r, this._ac.signal);

                    }
                }).catch((err) => {
                    console.log("Catched", i, err);
                    return Promise.reject(err);
                });
            };
        });

        return init(true, this._ac).then((result) => {
            console.log("Makro stack done", result);
            this.timestamps.finished = Date.now();
            this.states.finished = true;
        }).catch((err) => {
            console.log("Makro stack aborted", err);
            this.states.finished = false;
        }).finally(() => {
            console.log("Finaly");
            this.states.running = false;
        });

    }


    abort() {

        // fix #507
        if (this.states.running && this._ac) {
            this._ac.abort();
        }

        this.states.running = false;
        this.states.aborted = true;
        this.states.finished = false;

        this.timestamps.aborted = Date.now();

    }

};