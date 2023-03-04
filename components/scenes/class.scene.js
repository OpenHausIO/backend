const Makro = require("./class.makro.js");


module.exports = class Scene {

    constructor(obj) {

        Object.assign(this, obj);
        this._id = String(obj._id);

        this.makros = obj.makros.map((makro) => {
            return new Makro(makro);
        });

        // private proerteies to be added
        // - running
        // - aborted

    }

    trigger() {

        let init = this.makros.map((makro) => {

            return makro.execute.bind(makro);

        }).reduce((acc, cur, i) => {
            return (result) => {

                return acc(result).then(cur).catch((err) => {
                    console.log("Catched", i, err);
                    return Promise.reject(err);
                });

            };
        });

        return init(true).then((result) => {
            console.log("Makro stack done", result);
        }).catch((err) => {
            console.log("Makro stack aborted", err);
        });

    }

};