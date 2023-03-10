const Makro = require("./class.makro.js");


module.exports = class Scene {

    constructor(obj) {

        Object.assign(this, obj);
        this._id = String(obj._id);

        this.makros = obj.makros.map((makro) => {
            return new Makro(makro);
        });

        Object.defineProperty(this, "running", {
            value: false,
            enumerable: false,
            configurable: false,
            writable: true
        });

        Object.defineProperty(this, "aborted", {
            value: false,
            enumerable: false,
            configurable: false,
            writable: true
        });

        Object.defineProperty(this, "index", {
            value: 0,
            enumerable: false,
            configurable: false,
            writable: true
        });

        Object.defineProperty(this, "finished", {
            value: false,
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

    }

    trigger() {

        let ac = new AbortController();
        this._ac = ac;

        let init = this.makros.map((makro) => {

            // bind scope to method
            return makro.execute.bind(makro);

        }).reduce((acc, cur, i) => {
            return (result) => {
                return acc(result, this._ac.signal).then((r) => {
                    if (this.aborted) {

                        return Promise.reject("Aborted!");

                    } else {

                        this.index = i;
                        return cur(r, this._ac.signal);

                    }
                }).catch((err) => {
                    console.log("Catched", i, err);
                    return Promise.reject(err);
                });
            };
        });

        this.running = true;
        this.aborted = false;
        this.finished = false;
        this.index = 0;

        return init(true, this._ac).then((result) => {
            console.log("Makro stack done", result);
            this.finished = true;
        }).catch((err) => {
            console.log("Makro stack aborted", err);
            this.finished = false;
        }).finally(() => {
            console.log("Finaly");
            this.running = false;
        });

    }


    abort() {

        console.log("Aborted called");

        this._ac.abort();
        this.running = false;
        this.aborted = true;
        this.finished = false;

    }

};