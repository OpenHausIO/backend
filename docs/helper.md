# Helper functions
Helper functions are a collection of commonly used function.
This collection should help you to avoid the need of external modules like "underscore" or similiar and allows you to writer smaler plugins.

## Table of contents 
- [debounce(func, wait[, immediate])](#debouncefunc-wait-immediate)
- [extend(target, ...sources)](#extendtarget-sources)
- [filter(obj, predicate)](#filterobj-predicate)
- [iterate(obj, cb)__](#iterateobj-cb)
- [mixins(objs, options[, lookup])](#mixinsobjs-options-lookup)
- [observe(target[, options, setter, getter])](#observetarget-options-setter-getter)
- [promisify(worker, cb)](#promisifyworker-cb)
- [queue(counter, cb)](#queuecounter-cb)
- [timeout(time, cb)](#timeouttime-cb)


### __debounce(func, wait[, immediate])__
* `func` {Function} Function that is called after `wait` elapsed.
* `wait` {Number} Time in ms to wait before call `fnc`.
* `immediate` {Boolean} Call `func` immediatly when return function is called.
> Debounce a function call.

Returns a function that is called instead directly of `func`.


### __extend(target, ...sources)__
* `target` {Object} Target where all sources are merged into.
* `...sources` {Array|Object} Things that are merged into target.
> Merges one or more sources into a single target.


### __filter(obj, predicate)__
* `obj` {Object} 
* `predicate` {Object}
> filter for todo...


### __iterate(obj, cb)__
* `obj` {Object} Target object on which the iteration is procceded.
* `cb` {Function} Function that is called on each iteration step.
> Iterate over *everything* inside the object. 
> Including ever item in arrays/sub-objects.


### __mixins(objs, options[, lookup])__
* `objs` {Array} Array of objects to merged. First item in the array has a special purpose.
* `options` {Object} Options object.
* `lookup` {Function} That is called when on the target object a propertie is get, see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/get
> Mix/merge a bunch of objects into a single one.


### __observe(target[, options, getter, setter])__
* `target` {Object} to observe.
* `options` {Object} Options object.
* `options.intercept` {Boolean} Intercept get/set calls. If set, `setter`/`getter` must return `true`/`false` to permit the opertion
* `getter` {Function} Function that is called on get opertions. See [handler.get()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/get)
* `setter` {Function} Function that is called on set opertions. See [handler.set()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/set)
> Observe changes on a object.

Returns the observed object, where changes trigger `setter`/`getter`


### __promisify(worker, cb)__
* `worker` {Function} Function which is wrapped.
* `cb` {Function} Callback, which can be omited. If `undefined` or set to "falsly" value, a promise is returned.
> Promsify a callback function.


### __queue(counter, cb)__
* `counter` {Number} Counter, how often the returned function needed to be called to fire `cb`.
* `cb` {Function} Callback which is fired when the returned function is called `counter` times.
> Queue a function call to `counter`.

Returns a function, that needs to be called *x* times.


### __timeout(time, cb)__
* `time` {Number} Timeout it ms to wait before call `cb`.
* `cb` {Function} Callback which should be called after `time`.
>  Calls a callback function  automaticly after `time`, unless the returned function is not called before timeout is reached.

Return a function that can be called to trigger `cb`.


### __infinty(worker, delay)__
* `worker` {Function} Worker callback that is with a delay of `time` called.
* `delay` {Number} Delay to wait before calling`worker` again.
> Calls the worker function, passes a "retry" function as only argument.
> If the retry function is called, its wait the time set as `delay` and call then the worker code again

Ifinity function handling. For "redo" every time the "retery" function is called.