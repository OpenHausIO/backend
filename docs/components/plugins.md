# [🗀](../../components/plugins) PLUGINS

> [C_PLUGINS](./) extends [COMMON_COMPONENT](../system/component.md)

Component to manage/update plugins that extend the functionlity of OpenHaus


---


## Table of contents 
- Schema
- Methods
  - [Add](#adddatacb) *Add new plugin*
  - [Get](#getidcb) *Get existing plugin*
  - [Remove](#removeidcb) *Removes exisiting plugin*
  - [Update](#updateid-datacb) *Update plugin*
  - [Find](#findobjcb) *Find plugin in database*
- Classes
  - [class.plugin.js]() *Represents a plugin instance*


---


## Schema
| Name               | Type    | Required | Default value | Description                                                                      |
| ------------------ | ------- | -------- | ------------- | -------------------------------------------------------------------------------- |
| _id                | String  |          | [ObjectId]()  | MongoDB ObjectID converted to a String                                           |
| name               | String  | x        |               | Human friendly name e.g. "Smasung Smart TV", "Pioneer AV Receiver"               |
| uuid               | String  |          | uuid v4       | UUIDv4, which is used as filename                                                |
| timestamps         | Object  |          |               | Timestamps, when something was done to the object e.g. `created`/`updated`       |
| timestamps.created | Number  |          | `Date.now()`  | Unix timestamp, set when [`.add`](#adddatacb) is called to `Date.now()`          |
| timestamps.updated | Number  |          | `null`        | Unix timestamp, set to `Date.now()` when [`.update`](#updateid-datacb) is called |
| autostart          | Boolean |          | `true`        | Autostart/[boot]() the plugin automaticly on start                               |
| enabled            | Boolean |          | `true`        | Indicates if user accounts can be used to login/is enabled for use               |

### Example

```json
{
  "_id":"60ede907953fe23d3c585852",
  "name":"ZigBee Gateway (DeCONz)",
  "uuid":"d11e7f38-91cb-4f32-89e8-3452f624bb47",
  "timestamps":{
    "created":1628451824939,
    "updated":null
  },
  "enabled":true,
  "autostart":true
}
```


---


## Methods

### __add(data[,cb])__
* `data` {Object} Object structure as defined in schema.
* `cb` {Function} Callback function, if absent, a promise is returned.
> Add a new plugin to the database and creates a plugin instance

### __get(id[,cb])__
* `id` {String} plugin id as defined in schema.
* `cb` {Function} Callback function, if absent, a promise is returned.
> Get a plugin from the `.items` array

### __remove(id[,cb])__
* `id` {String} plugin id as defined in schema.
* `cb` {Function} Callback function, if absent, a promise is returned.
> Removes a plugin from the database

### __update(id, data[,cb])__
* `id` {String} plugin id as defined in schema.
* `data` {Object} Properties to update on plugin `id` object/instance.
* `cb` {Function} Callback function, if absent, a promise is returned.
> Updates a plugin object in database & plugin instance in `.items` array

### __find(obj[,cb])__
* `obj` {Object} Key/value to look for plugins.
* `cb` {Function} Callback function, if absent, a promise is returned.
> Find plugin with mathing key/values pair in the `.items` array


---

## Classes

### class.plugins.js
> Represent a plugin instance