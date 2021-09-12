# SYSTEM/hooks

## Table of contents 
- Properties
  - [`namespace`](#namespace)
- Methods
  - [_namespace]() Creates a new namespace with pre/post [middleware](./middleware.md)


---


## Properties

### `.namespace`
Object for storing middleware instances. See: [middleware](./middlare.md)


---


## Methods

### ___handleEventType(type, name, cb)__
* `type` {String}
* `name` {String | Array}
* `cb`

### __pre(name, cb)__
* `name` {String}
* `cb` {Function}


### __post(name, cb)__
* `name` {String}
* `cb` {Function}


### __trigger(name, ...args)__
* `name` {String}
* `...args` {Any}