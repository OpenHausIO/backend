/**
 * @description
 * This file is used to share various things between components<br />
 * A component is intended to be independet on other components<br />
 * But some times its needed to "expose" or share things.<br />
 * Thats the purpose of this file.
 * 
 * @returns {Object} module.exports The module object
 * @returns {Map} module.exports.interface_server WebSocket server created for each interface
 * @returns {Map} module.exports.interface_streams Interface streams
 * @returns {Map} module.exports.interfaces Interfaces instances
 * 
 * @see InterfaceStreams components/devices/class.interfaceStream.js
 * @see Interfaces components/devcies/class.interface.js
 */
module.exports = {
    interfaceStreams: new Map(),
    interfaceServer: new Map(),
    interfaces: new Map()
};