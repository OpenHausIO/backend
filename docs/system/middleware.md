# SYSTEM/middleware

## Table of contents 
- Properties
  - [`catcher`](#namespace)
  - [`__obj`]()
- Methods
  - [use](#usefn)
  - [start](#startargs)
  - [catch](#catchfn)


---


## Properties

### `.catcher`
Function that is called when the first argument passed `.next` is a instance of [Error](https://nodejs.org/api/errors.html#errors_class_error)


---


## Methods

### __use(fn)__
* `cb` {Function} Function that should be called with the parameters passed to [.trigger(...)](#startargs)

### __start(...args)__
* `...args` {Any} that are passed to the callback registerd on [.use(cb)](#usefn)

### __catch(fn)__
* `fn` {Function}