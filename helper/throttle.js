module.exports = function throttle(callback, interval = 10) {

    let lastCall = 0;

    return function (...args) {

        const now = Date.now();

        if (now - lastCall >= interval) {
            lastCall = now;
            callback.apply(this, args);
        }

    };

};