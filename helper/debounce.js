// https://davidwalsh.name/javascript-debounce-function

function debounce(func, wait, immediate = false) {

    let timeout = null;

    return function (...args) {

        let later = () => {

            timeout = null;

            if (!immediate) {
                func.apply(this, args);
            }

        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);

        if (immediate && !timeout) {
            func.apply(this, args);
        }

    };

}

module.exports = debounce;