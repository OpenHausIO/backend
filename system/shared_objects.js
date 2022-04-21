/**
 * Track the line of exection
 * 
 * @returns {Object} module.exports
 * @returns {Map} module.exports.interface_server
 * @returns {Map} module.exports interface_streams
 * 
 * @returns {Map} module.exports interface_upstreams
 */
module.exports = {
    interface_server: new Map(),
    interface_streams: new Map(),    // change to "Set"?!
    interface_upstreams: new Map()
};