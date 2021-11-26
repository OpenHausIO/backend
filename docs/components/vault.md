# [🗀](../../components/vault) VAULT

> [C_VAULT](./) extends [COMMON_COMPONENT](../system/component.md)

Component to handle username/password & API tokens which are used to authenticate gains servcies & devices.


---


## Table of contents 
- Schema
- Methods
  - [Add](#adddatacb) *Add new deivce*
  - [Get](#getidcb) *Get existing Vault*
  - [Remove](#removeidcb) *Removes exisiting Vault*
  - [Update](#updateid-datacb) *Update Vault*
  - [Find](#findobjcb) *Find Vault in database*
- Classes
  - [class.secret.js]() *Represents a single field instance*

****
---


## Schema
| Name                  | Type   | Required | Default value | Description                                                                      |
| --------------------- | ------ | -------- | ------------- | -------------------------------------------------------------------------------- |
| _id                   | String |          | [ObjectId]()  | MongoDB ObjectID converted to String                                             |
| name                  | String | x        |               | Human friendly name e.g. "Weather API", "ZigBee Gateway"                         |
| identifier            | String | x        |               | Identifier for Plugin/Hardcoded                                                  |
| fields                | Array  |          | `[]`          | Array fof fields needed, e.g. "Username", "Password", "API Token"                |
| fields[0]._id         | String |          | [ObjectId]()  | MongoDB ObjectID converted to string                                             |
| fields[0].name        | String | x        |               | Humany friendly name                                                             |
| fields[0].description | String |          | `null`        | Field description                                                                |
| fields[0].key         | String | x        |               | Hardcoded value in Plugin                                                        |
| fields[0].value       | String |          |               | Encrypted field value                                                            |
| timestamps            | Object |          |               | Timestamps, when something was done to the object e.g. `created`/`updated`       |
| timestamps.created    | Number |          | `Date.now()`  | Unix timestamp, set when [`.add`](#adddatacb) is called to `Date.now()`          |
| timestamps.updated    | Number |          | `null`        | Unix timestamp, set to `Date.now()` when [`.update`](#updateid-datacb) is called |

### Example

```json
{
    "_id": "6199783105707e5faa429368",
    "name": "ZigBee Gateway",
    "identifier": "ZIGBEE_GW_RASPBEE",
    "fields": [
        {
            "name": "API Token",
            "key": "API_TOKEN",
            "_id": "6199783105707e5faa429369",
            "description": null,
            "value": "128ab9c6adb33c19878c0c67770618d3:74e4314d1083cfa5d9cc2550d97d1a6a:3de9d2c47a4e8e38e0886870d47c729ee994ed0fa4e24ba906180a954732d5a081a6ca57c08db289f51097c42f0fb992708fef34c561a92a2341bfd30763f2fd"
        },
        {
            "name": "Username",
            "key": "USERNAME",
            "description": null,
            "value": "32d5ab650c265d455e75df6fbf7678a9:59fcc731e92aef826fa1e13498666816:e63217c7d1e86806d6986fa3cb3da731ea95e1383cfb524895e48db5c963fc25",
            "_id": "619e8169bf178d249985aab6"
        },
        {
            "name": "User Password",
            "key": "PASSWORD",
            "description": null,
            "value": "3351583b3a22daaaf283b2cf37d2fde1:430214393d16835aeb0ab8deb0128fd1:2fe7c9d0c7841ab0bcd126cd25c86806",
            "_id": "619e815abf178d249985aab5"
        }
    ],
    "timestamps": {
        "created": 1637447729869,
        "updated": 1637783734049
    }
}
```


---


## Methods

### __add(data[,cb])__
* `data` {Object} Object structure as defined in schema.
* `cb` {Function} Callback function, if absent, a promise is returned.
> Add a new Vault to the database and creates a Vault instance

### __get(id[,cb])__
* `id` {String} Vault id as defined in schema.
* `cb` {Function} Callback function, if absent, a promise is returned.
> Get a Vault from the `.items` array

### __remove(id[,cb])__
* `id` {String} Vault id as defined in schema.
* `cb` {Function} Callback function, if absent, a promise is returned.
> Removes a Vault from the database

### __update(id, data[,cb])__
* `id` {String} Vault id as defined in schema.
* `data` {Object} Properties to update on Room `id` object/instance.
* `cb` {Function} Callback function, if absent, a promise is returned.
> Updates a Vault object in database & Vault instance in `.items` array

### __find(obj[,cb])__
* `obj` {Object} Key/value to look for Vault.
* `cb` {Function} Callback function, if absent, a promise is returned.
> Find Vault with mathing key/values pair in the `.items` array

### __encrypt(id, data[,cb])__
* `id` {String} Vault id (ObjectID)
* `data` {Object} Field key/value object to encrypt values
* `cb` {function} Callback function, if absent, a promise is returned.
> Encrypt data values & update document

### __decrypt(id[,cb])__
* `id` {String} Vault id (ObjectID)
* `cb` {function} Callback function, if absent, a promise is returned.
> Decrypt field values

---

## Classes

### class.secret.js
> Represent a single field instance