const Joi = require("joi");
const mongodb = require("mongodb");

const { setTimeout } = require("timers/promises");
const debounce = require("../../helper/debounce.js");

const Makro = require("./class.makro.js");
const Trigger = require("./class.trigger.js");
const Input = require("./class.input.js");

const Item = require("../../system/component/class.item.js");


module.exports = class Scene extends Item {

    constructor(obj) {

        super(obj);

        // removed for #356
        //Object.assign(this, obj);
        //this._id = String(obj._id);

        // override values, start clean
        Object.assign(obj?.states || {}, {
            running: false,
            aborted: false,
            finished: false,
            index: 0
        });

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

        Object.defineProperty(this, "_ac", {
            value: null,
            enumerable: false,
            configurable: false,
            writable: true
        });


        // like in state updated
        // see components/endpoints/class.state.js
        let updater = debounce(async (prop, value) => {

            let { update, logger } = Scene.scope;

            try {

                await update(this._id, this);

            } catch (e) {

                // feedback
                logger.warn(e, `Could not update scene object, last property change: ${prop}=${value}`);

            } finally {

                // feedback
                logger.verbose(`Updated scene object, last property change: ${prop}=${value}`);

            }

        }, 100);


        // wrap timestamps in proxy set trap
        // update item in database when the timestamps
        // "started", "finished" or "aborted" set
        // this ensures that theay are not `null` after a restart
        this.timestamps = new Proxy(obj.timestamps, {
            set: (target, prop, value, receiver) => {

                let { logger } = Scene.scope;

                if (["started", "finished", "aborted"].includes(prop) && value !== target[prop]) {

                    // feedback
                    logger.debug(`Update timestamp: ${prop}=${value}`);

                    // call debounced `.update()`
                    updater(prop, value);

                }

                return Reflect.set(target, prop, value, receiver);

            }
        });


        // catch set operations on states object
        // emit/trigger events/update
        this.states = new Proxy(this?.states || {}, {
            set: (target, prop, value, receiver) => {

                let { logger, events } = Scene.scope;

                if (value !== target[prop]) {

                    // feedback
                    logger.debug(`state object changed, ${prop}=${value}`);

                    events.emit("state", this.states, this);

                    // call debounced `.update()`
                    updater(prop, value);

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
            inputs: Joi.array().items(Input.schema()).default([]),
            states: Joi.object({
                running: Joi.boolean().default(false),
                aborted: Joi.boolean().default(false),
                finished: Joi.boolean().default(false),
                index: Joi.number().default(0),
            }).default({}),
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

    static registerMakro() {

    }

    trigger(inputs) {

        let { logger } = Scene.scope;
        logger.info(`Trigger scene "${this.name}" (${this._id}), inputs:`, inputs);

        // fix #507
        // stop previous running scene
        if (this.states.running && this._ac) {
            logger.debug(`Abort previously running scene "${this.name}" (${this._id})`);
            this._ac.abort();
        }

        // Without this, when the scene is done
        // default values are set for input
        // we need to ensure that the "input" value are correct saved
        inputs?.forEach(({ key, value }) => {

            let input = this.inputs.find((input) => {
                return input.key === key;
            });

            input.value = value;

        });

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

            // monkey patch input/params array
            if (makro.type === "command") {
                makro.params = inputs;
            }

            // bind scope to method
            return makro.execute.bind(makro);

        }).reduce((acc, cur, i) => {
            return (result) => {
                return acc(result, this._ac.signal, this).then(async (r) => {
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

                        return cur(r, this._ac.signal, this);

                    }
                }).catch((err) => {
                    console.log("Catched", i, err);
                    return Promise.reject(err);
                });
            };
        });

        return init(true, this._ac).then(() => {
            this.timestamps.finished = Date.now();
            this.states.finished = true;
            logger.debug(`Scene "${this.name}" finished`);
        }).catch((err) => {
            this.states.finished = false;
            logger.debug(err, `Scene "${this.name}" error`);
        }).finally(() => {
            this.states.running = false;
            logger.info(`Scene "${this.name}" runned`, this.states);
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

        let { logger } = Scene.scope;

        logger.info(`Scene "${this.name}" aborted!`);

    }

};