# [🗀](../../comonents/rooms) ROOMS

> [C_ROOMS](./) extends [COMMON_COMPONENT](../system/component.md)

Component to manage/update rooms, which should represent your phiscal building.


---


## Table of contents 
- Schema
- Methods
  - [Add](#adddatacb) *Add new deivce*
  - [Get](#getidcb) *Get existing Room*
  - [Remove](#removeidcb) *Removes exisiting Room*
  - [Update](#updateid-datacb) *Update Room*
  - [Find](#findobjcb) *Find Room in database*
- Classes
  - [class.room.js]() *Represents a room instance*


---


## Schema
| Name               | Type   | Required | Default value | Description                                                                      |
| ------------------ | ------ | -------- | ------------- | -------------------------------------------------------------------------------- |
| _id                | String |          | [ObjectId]()  | MongoDB ObjectID converted to a String                                           |
| name               | String | x        |               | Human friendly name e.g. "Living room", "Bed room"                               |
| number             | Number |          |               | Room number                                                                      |
| floor              | Number |          |               | Floor number on which the rooms is located                                       |
| icon               | String |          |               | Icon name                                                                        |
| timestamps         | Object |          |               | Timestamps, when something was done to the object e.g. `created`/`updated`       |
| timestamps.created | Number |          | `Date.now()`  | Unix timestamp, set when [`.add`](#adddatacb) is called to `Date.now()`          |
| timestamps.updated | Number |          | `null`        | Unix timestamp, set to `Date.now()` when [`.update`](#updateid-datacb) is called |

### Example

```json
{
  "_id":"6032794756b6681d420d1946",
  "name":"Kitchen",
  "timestamps":{
    "created":1613920583473,
    "updated":null
  }
}
```


---


## Methods

### __add(data[,cb])__
* `data` {Object} Object structure as defined in schema.
* `cb` {Function} Callback function, if absent, a promise is returned.
> Add a new Room to the database and creates a Room instance

### __get(id[,cb])__
* `id` {String} Room id as defined in schema.
* `cb` {Function} Callback function, if absent, a promise is returned.
> Get a Room from the `.items` array

### __remove(id[,cb])__
* `id` {String} Room id as defined in schema.
* `cb` {Function} Callback function, if absent, a promise is returned.
> Removes a Room from the database

### __update(id, data[,cb])__
* `id` {String} Room id as defined in schema.
* `data` {Object} Properties to update on Room `id` object/instance.
* `cb` {Function} Callback function, if absent, a promise is returned.
> Updates a Room object in database & Room instance in `.items` array

### __find(obj[,cb])__
* `obj` {Object} Key/value to look for Rooms.
* `cb` {Function} Callback function, if absent, a promise is returned.
> Find Room with mathing key/values pair in the `.items` array


---

## Classes

### class.rooms.js
> Represent a Room instance