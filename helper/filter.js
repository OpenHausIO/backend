function filter(obj, predicate) {
    // https://stackoverflow.com/a/37616104/5781499
    return Object.keys(obj).filter(key => predicate(obj[key])).reduce((res, key) => (res[key] = obj[key], res), {});
}

module.exports = filter;