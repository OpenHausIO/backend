module.exports = (prev, options) => {
    return new Promise((resolve, reject) => {

        setTimeout(() => {
            resolve(null);
        }, options.delay);

    });
};