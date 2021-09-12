# [🗀](../../comonents/endpoints) endpointS

> [C_ENDPOINTS](./) extends [COMMON_COMPONENT](../system/component.md)

Component to manage/update endpoints, which should represent your phiscal building.


---


## Table of contents 
- Schema
- Methods
  - [Add](#adddatacb) *Add new deivce*
  - [Get](#getidcb) *Get existing endpoint*
  - [Remove](#removeidcb) *Removes exisiting endpoint*
  - [Update](#updateid-datacb) *Update endpoint*
  - [Find](#findobjcb) *Find endpoint in database*
- Classes
  - [class.endpoint.js]() *Represents a endpoint instance*
  -  [class.commands.js]() *Extends `Array` to implement some custom methods, used to house one or more commands*
  - [class.command.js]() *Represents a single command*


---


## Schema
| Name               | Type    | Required | Default value | Description                                                                         |
| ------------------ | ------- | -------- | ------------- | ----------------------------------------------------------------------------------- |
| _id                | String  |          | [ObjectId]()  | MongoDB ObjectID converted to a String                                              |
| name               | String  | x        |               | Human friendly name                                                                 |
| room               | String  |          | [ObjectId]()  | ObjectID of a [room](./rooms.md)                                                    |
| device             | String  | x        | [ObjectId]()  | ObjectID of a [device](./devices.md)                                                |
| commands           | Array   |          | `[]`          | Array of commands which can issued to control the deivce. See [class.commands.js]() |
| timestamps         | Object  |          |               | Timestamps, when something was done to the object e.g. `created`/`updated`          |
| timestamps.created | Number  |          | `Date.now()`  | Unix timestamp, set when [`.add`](#adddatacb) is called to `Date.now()`             |
| timestamps.updated | Number  |          | `null`        | Unix timestamp, set to `Date.now()` when [`.update`](#updateid-datacb) is called    |
| enabled            | Boolean |          | `true`        | Indicates if the device should be handeld                                           |

### Example

```json
{
  "_id":"604a75e6eb5de037846df24f",
  "name":"AV - Receiver",
  "room":"604a62e292c9d22044003c84",
  "device":"603fe5d18791152879a9babc",
  "commands":[
    {
      "name":"Power On",
      "payload":"PWR01",
      "interface":"603fe5d18791152879a9babd",
      "_id":"604a75e6eb5de037846df24c"
    },
    {
      "name":"Power Off",
      "payload":"PWR00",
      "interface":"603fe5d18791152879a9babd",
      "_id":"604a75e6eb5de037846df24d"
    },
    {
      "name":"Mute Toggle",
      "payload":"AMTTG",
      "interface":"603fe5d18791152879a9babd",
      "_id":"604a75e6eb5de037846df24e"
    },
    {
      "name":"Power Toggle",
      "payload":"POWER",
      "interface":"603fe5d18791152879a9babd",
      "_id":"604a75e6eb5de037846df24f"
    }
  ],
  "timestamps":{
    "created":1615492582995,
    "updated":null
  },
  "enabled":true
}
```


---


## Methods

### __add(data[,cb])__
* `data` {Object} Object structure as defined in schema.
* `cb` {Function} Callback function, if absent, a promise is returned.
> Add a new endpoint to the database and creates a endpoint instance

### __get(id[,cb])__
* `id` {String} endpoint id as defined in schema.
* `cb` {Function} Callback function, if absent, a promise is returned.
> Get a endpoint from the `.items` array

### __remove(id[,cb])__
* `id` {String} endpoint id as defined in schema.
* `cb` {Function} Callback function, if absent, a promise is returned.
> Removes a endpoint from the database

### __update(id, data[,cb])__
* `id` {String} endpoint id as defined in schema.
* `data` {Object} Properties to update on endpoint `id` object/instance.
* `cb` {Function} Callback function, if absent, a promise is returned.
> Updates a endpoint object in database & endpoint instance in `.items` array

### __find(obj[,cb])__
* `obj` {Object} Key/value to look for endpoints.
* `cb` {Function} Callback function, if absent, a promise is returned.
> Find endpoint with mathing key/values pair in the `.items` array


---

## Classes

### class.endpoints.js
> Represent a endpoint instance