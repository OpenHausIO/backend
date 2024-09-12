//const logger = require("../../system/logger").create("rooms");
//const COMMON_COMPONENT = require("../../system/component/common.js");
const COMPONENT = require("../../system/component/class.component.js");

const Room = require("./class.room.js");

/**
 * @description
 * The room component handles the managing of rooms (What a suprise... 😜)
 * 
 * @class C_ROOMS
 * @extends COMPONENT system/component/class.component.js
 * 
 * @example
 * ```js
 * const C_ROOMS = require(".../components/rooms");
 * 
 * C_ROOMS.find({name: "Living Room"}, (err, item) => {
 *   console.log(err || item);
 * });
 * ```
 * 
 * @example
 * ```js
 * const C_ROOMS = require(".../components/rooms");
 * 
 * // "convert" room name to uppercase
 * C_ROOMS.hooks.pre("add", (data, next) => {
 *   data.name = String(data.name).toUpperCase();
 *   next();
 * });
 * ```
 *
 * @example
 * ```js
 * const C_ROOMS = require(".../components/rooms");
 * 
 * C_ROOMS.add({
 *   name: "Garage",
 *   floor: 0
 * }, (err, item) => {
 *   // item = instance of Room class
 *   console.log(err || item);
 * });
 * ```
 */
class C_ROOMS extends COMPONENT {
    constructor() {

        // inject logger, collection and schema object
        super("rooms", Room.schema());

        this.hooks.post("add", (data, next) => {
            next(null, new Room(data));
        });

        // export method from item class
        //this._exportItemMethod("customTestMethod");

    }
}


// create component instance
const instance = module.exports = new C_ROOMS();


// init component
// set items/build cache
instance.init((scope, ready) => {
    scope.collection.find({}).toArray((err, data) => {
        if (err) {

            // shit...
            ready(err);

        } else {

            data = data.map((obj) => {
                return new Room(obj);
            });

            scope.items.push(...data);

            // init done
            ready(null);

        }
    });
});