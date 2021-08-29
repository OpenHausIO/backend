module.exports = (prev, options) => {
    return new Promise((resolve, reject) => {

        // execute command
        // not sure how to do this
        // implement event bus?!

        console.log("Command makro", options);
        setTimeout(resolve, 1000);

    });
};