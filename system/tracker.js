/**
 * @function track
 * Track the line of exection
 *
 * @param {Number} depth Deept of dtracking
 * 
 * @returns {Object} object with information of caller `.line` & `.filename`
 */
module.exports = function track(depth = 0) {

    // https://v8.dev/docs/stack-trace-api
    // https://github.com/tj/callsite

    const orig = Error.prepareStackTrace;
    Error.prepareStackTrace = (ignore, stack) => stack;

    const capture = {};
    Error.captureStackTrace(capture, this);
    const line = capture.stack[depth + 1];

    Error.prepareStackTrace = orig;


    return Object.assign(line, {
        filename: line.getFileName(),
        line: line.getLineNumber()
    });


};