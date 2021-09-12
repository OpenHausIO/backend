# SYSTEM/components

## Table of contents 
- Properties
  - [`hooks`](#hooks)
  - [`events`](#events)
  - [`items`](#items)
- Methods
  - [defineMethod2]()
  - [init]()
- Classes
  - [class.components.js]()


## Properties

### `.hooks`
Hooks represent a hooks instance, which allows to manipluate methods calls. See: [hooks](./hooks.md)

### `.events`
[EventEmitter](https://nodejs.org/dist/latest-v14.x/docs/api/events.html#events_class_eventemitter) instance, to listen for events that happen in the components. E.g. Method was called and has finished.

### `.items`
Array that holds instances of the implementing class.<br />
E.g. [devices](../components/devices.md#class.device.js) in the [devices component](../components/devices.md)


## Methods

### __defineMethod(name, worker)__
* `name` {String} Method name that is used to `Object.defineProperty` on the component instance.
* `worker` {Function} Worker that handles the implementation of your function
> Defines a method on `this`/class instance which is hoockable with pre/post hooks and emit events


### __init(worker)__
* `worker` {Function} Worker that initialise the component
> `worker` is called like this `worker(this, cb)`, so when the initalizien is complete, "cb" is called and emits "ready".
> The init function is used to fill the `.items` array for example.