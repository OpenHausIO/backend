# Helper functions
Helper functions are a collection of commonly used function.
This collection should help you to avoid the need of external modules like "underscore" or similiar and allows you to writer smaler plugins.

## Table of contents 
- [debounce(func, wait[, immediate])](#debouncefunc-wait-immediate) [<sup><sub>[source]</sub></sup>](../helper/debounce.js)
- [extend(target, ...sources)](#extendtarget-sources) [<sup><sub>[source]</sub></sup>](../helper/extend.js)
- [infinity(worker[,delay])](#infintyworker-delay3000) [<sup><sub>[source]</sub></sup>](../helper/infinity.js)
- [iterate(obj, cb)](#iterateobj-cb) [<sup><sub>[source]</sub></sup>](../helper/iterate.js)
- [mixins(objs, options[, lookup])](#mixinsobjs-options-lookup) [<sup><sub>[source]</sub></sup>](../helper/mixins.js)
- [observe(target[, options, setter, getter])](#observetarget-options-setter-getter) [<sup><sub>[source]</sub></sup>](../helper/observe.js)
- [promisify(worker, cb)](#promisifyworker-cb) [<sup><sub>[source]</sub></sup>](../helper/promisify.js)
- [queue(counter, cb)](#queuecounter-cb) [<sup><sub>[source]</sub></sup>](../helper/queue.js)
- [request(url[, options, cb])](#requesturloptionscb) [<sup><sub>[source]</sub></sup>](../helper/request.js)
- [sanitize.encode(input[,rules])](#sanitizeencodeinputrules) [<sup><sub>[source]</sub></sup>](../helper/sanitize.js)
- [sanitize.decode(input[,rules])](#sanitizedecodeinputrules) [<sup><sub>[source]</sub></sup>](../helper/sanitize.js)
- [timeout(time, cb)](#timeouttime-cb) [<sup><sub>[source]</sub></sup>](../helper/timeout.js)


### __debounce(func, wait[, immediate])__
> Debounce a function call. 
* `func` {Function} Function that is called after `wait` elapsed.
* `wait` {Number} Time in ms to wait before call `fnc`.
* `immediate` {Boolean} Call `func` immediatly when return function is called.

Returns a function that is called instead directly of `func`. 


### __extend(target, ...sources)__
> Merges one or more sources into a single target.
* `target` {Object} Target where all sources are merged into.
* `...sources` {Array|Object} Things that are merged into target.


### __infinty(worker[, delay=3000])__
> Calls the worker function, passes a "retry" function as only argument.
> If the retry function is called, its wait the time set as `delay` and call then the worker code again
* `worker` {Function} Worker callback that is with a delay of `time` called.
* `delay` {Number} Delay to wait before calling`worker` again.

Ifinity function handling. For "redo" every time the "retery" function is called.


### __iterate(obj, cb)__
> Iterate over *everything* inside the object. 
> Including ever item in arrays/sub-objects.
* `obj` {Object} Target object on which the iteration is procceded.
* `cb` {Function} Function that is called on each iteration step.


### __mixins(objs, options[, lookup])__
> Mix/merge a bunch of objects into a single one.
* `objs` {Array} Array of objects to merged. First item in the array has a special purpose.
* `options` {Object} Options object.
* `lookup` {Function} That is called when on the target object a propertie is get, see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/get


### __observe(target[, options, getter, setter])__
> Observe changes on a object.
* `target` {Object} to observe.
* `options` {Object} Options object.
* `options.intercept` {Boolean} Intercept get/set calls. If set, `setter`/`getter` must return `true`/`false` to permit the opertion
* `getter` {Function} Function that is called on get opertions. See [handler.get()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/get)
* `setter` {Function} Function that is called on set opertions. See [handler.set()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/set)

Returns the observed object, where changes trigger `setter`/`getter`


### __promisify(worker, cb)__
> Promsify a callback function.
* `worker` {Function} Function which is wrapped.
* `cb` {Function} Callback, which can be omited. If `undefined` or set to "falsly" value, a promise is returned.



### __queue(counter, cb)__
> Queue a function call to `counter`.
* `counter` {Number} Counter, how often the returned function needed to be called to fire `cb`.
* `cb` {Function} Callback which is fired when the returned function is called `counter` times.

Returns a function, that needs to be called *x* times.


### __request(url[,options[,cb]])__
> Does a HTTP/HTTPS request to `url` <br />
> Just axios or fetch with build in node.js modules <br />
> See [http](https://nodejs.org/dist/latest-v16.x/docs/api/http.html#httprequesturl-options-callback) module for more information
* `url` {String} URL to the resource
* `options` {Object} [Options](https://nodejs.org/dist/latest-v16.x/docs/api/http.html#httprequesturl-options-callback) for http request
* `cb` {Function} Callback with the result for the request


### __sanitize.encode(input[,rules])__
> Replace malicious chars with html encoded entities
* `input` {String} String that contains potential malicious input
* `rules` {Array} additional rule set

Return the encoded string

### __sanitize.decode(input[,rules])__
> Replace html encoded entites with original chars
* `input` {String} String that contains potential malicious input
* `rules` {Array} additional rule set

Return the decoded string


### __timeout(time, cb)__
>  Calls a callback function  automaticly after `time`, unless the returned function is not called before timeout is reached.
* `time` {Number} Timeout it ms to wait before call `cb`.
* `cb` {Function} Callback which should be called after `time`.

Return a function that can be called to trigger `cb`.