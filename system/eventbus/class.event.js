class Event {

    constructor(data) {

        this.created = Date.now();
        this.payload = data;

    }

}

module.exports = Event;