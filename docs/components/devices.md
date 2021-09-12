# [🗀](../../comonents/devices) DEVICES

> [C_DEVICES](./) extends [COMMON_COMPONENT](../system/component.md)

Component to manage/update devices, which are used to implement the underlying connectivity of OpenHaus.


---


## Table of contents 
- Schema
- Methods
  - [Add](#adddatacb) *Add new device*
  - [Get](#getidcb) *Get existing device*
  - [Remove](#removeidcb) *Removes exisiting device*
  - [Update](#updateid-datacb) *Update device*
  - [Find](#findobjcb) *Find device in database*
- Classes
  - [class.adapter.js]() *Represents a adapter instance*
  - [class.device.js]() *Represents a device instance*
  - [class.interface.js]() *Represents a interface instance*
  - [class.interfaceStream.js]() *Represents a interface stream instance*


---


## Schema
| Name               | Type    | Required | Default value | Description                                                                      |
| ------------------ | ------- | -------- | ------------- | -------------------------------------------------------------------------------- |
| _id                | String  |          | [ObjectId]()  | MongoDB ObjectID convert to a String                                             |
| name               | String  | x        |               | Human friendly name that represents the device                                   |
| interfaces         | Array   | x        |               | Interfaces that OpenHaus can connect to, see [class.interfaces.js]()             |
| timestamps         | Object  |          |               | Timestamps, when something was done to the object e.g. `created`/`updated`       |
| timestamps.created | Number  |          | `Date.now()`  | Unix timestamp, set when [`.add`](#adddatacb) is called to `Date.now()`          |
| timestamps.updated | Number  |          | `null`        | Unix timestamp, set to `Date.now()` when [`.update`](#updateid-datacb) is called |
| enabled            | Boolean |          | `true`        | Indicates if the device should be handeld                                        |

### Example

```json
{
  "_id":"603fe5d18791152879a9babc",
  "name":"AV - Receiver",
  "interfaces":[
    {
      "type":"ETHERNET",
      "transport":"tcp",
      "settings":{
        "host":"172.16.0.121",
        "port":60128
      },
      "_id":"603fe5d18791152879a9babd",
      "adapter":[
        "eiscp"
      ]
    }
  ],
  "timestamps":{
    "created":1614800337353,
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
> Add a new device to the database and creates a device instance

### __get(id[,cb])__
* `id` {String} Device id as defined in schema.
* `cb` {Function} Callback function, if absent, a promise is returned.
> Get a device from the `.items` array

### __remove(id[,cb])__
* `id` {String} Device id as defined in schema.
* `cb` {Function} Callback function, if absent, a promise is returned.
> Removes a device from the database

### __update(id, data[,cb])__
* `id` {String} Device id as defined in schema.
* `data` {Object} Properties to update on device `id` object/instance.
* `cb` {Function} Callback function, if absent, a promise is returned.
> Updates a device object in database & device instance in `.items` array

### __find(obj[,cb])__
* `obj` {Object} Key/value to look for devices.
* `cb` {Function} Callback function, if absent, a promise is returned.
> Find device with mathing key/values pair in the `.items` array


---

## Classes

### [🗀](../../components/devices/class.adapter.js) class.adapter.js
> Implements a adapter instance

### [🗀](../../components/devices/class.device.js) class.device.js
> Represent a device instance

### [🗀](../../components/devices/class.interface.js) class.interface.js
> Represent a device instance

### [🗀](../../components/devices/class.interfaceStream.js) class.interfaceStream.js
> Represent a device instance