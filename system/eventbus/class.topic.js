const { EventEmitter } = require("events");


module.exports = class Topic extends EventEmitter {

    constructor() {
        super();
        this._topics = {};
    }


    subscribe(uri, cb) {

        console.log(this);

        if (!this._topics[uri]) {
            this._topics[uri] = [];
        }

        this._topics[uri].push(cb);

    }


    publish(uri, val) {
        if (this._topics[uri]) {

            this._topics[uri].forEach((cb) => {
                cb(val);
            });

        } else {

            // do nothing?
            //throw new Error(`Topic ${uri} not found`);

        }
    }


    /*
    substopic(topicUri, subscriptionId, callback) {
        console.log("Registering topic " + topicUri + " subsc id " + subscriptionId);
        if (typeof this._topics[topicUri] === 'undefined') {
            this._topics[topicUri] = {};
        }
        this._topics[topicUri][subscriptionId] = callback;
        this.emit('Subscribe', topicUri);
    };

    unsubstopic(topicUri, subscriptionId) {
        console.log("Unregistering topic " + topicUri + " subsc id " + subscriptionId);
        delete this._topics[topicUri][subscriptionId];
        this.emit('Unsubscribe', topicUri);
    };

    publish(topicUri, publicationId, args, kwargs) {
        console.log("Publish " + topicUri + " " + publicationId);
        this.emit('Publish', topicUri, args, kwargs);
        if (typeof this._topics[topicUri] !== 'undefined') {
            for (var key in this._topics[topicUri]) {
                if (typeof this._topics[topicUri][key] !== 'undefined') {
                    this._topics[topicUri][key].apply(this, [publicationId, args, kwargs]);
                }
            }
            return true;
        } else {
            console.log("Undefined topic ");
            return false;
        }
    };
    */

};