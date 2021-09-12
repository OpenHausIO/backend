# [🗀](../../components/users) USERS

> [C_USERS](./) extends [COMMON_COMPONENT](../system/component.md)

Component to manage/update users, which should represent your phiscal building.


---


## Table of contents 
- Schema
- Methods
  - [Add](#adddatacb) *Add new user*
  - [Get](#getidcb) *Get existing User*
  - [Remove](#removeidcb) *Removes exisiting User*
  - [Update](#updateid-datacb) *Update User*
  - [Find](#findobjcb) *Find User in database*
- <span style="color:gray">Hooks</span>
- <span style="color:gray">Events</span>
- Classes
  - [class.user.js]() *Represents a user instance*


---


## Schema
| Name               | Type    | Required | Default value | Description                                                                      |
| ------------------ | ------- | -------- | ------------- | -------------------------------------------------------------------------------- |
| _id                | String  |          | [ObjectId]()  | MongoDB ObjectID converted to a String                                           |
| name               | String  | x        |               | Username                                                                         |
| email              | String  | x        |               | User E-Mail adress                                                               |
| password           | String  | x        |               | Password in plaintext, which gets bcryted                                        |
| timestamps         | Object  |          |               | Timestamps, when something was done to the object e.g. `created`/`updated`       |
| timestamps.created | Number  |          | `Date.now()`  | Unix timestamp, set when [`.add`](#adddatacb) is called to `Date.now()`          |
| timestamps.updated | Number  |          | `null`        | Unix timestamp, set to `Date.now()` when [`.update`](#updateid-datacb) is called |
| enabled            | Boolean |          | `true`        | Indicates if user accounts can be used to login/is enabled for use               |

### Example

```json
{
  "_id":"611033f0acc919461c3a1962",
  "name":"Name Surname",
  "email":"info@example.com",
  "password":"$2b$12$0E0RXurg73rd2/OJRDWepOlGKtgnbiv38NAwOnIarQkYku0v8cnFS",
  "timestamps":{
    "created":1628451824939,
    "updated":null
  },
  "enabled": true
}
```


---


## Methods

### __add(data[,cb])__
* `data` {Object} Object structure as defined in schema.
* `cb` {Function} Callback function, if absent, a promise is returned.
> Add a new User to the database and creates a User instance

### __get(id[,cb])__
* `id` {String} User id as defined in schema.
* `cb` {Function} Callback function, if absent, a promise is returned.
> Get a User from the `.items` array

### __remove(id[,cb])__
* `id` {String} User id as defined in schema.
* `cb` {Function} Callback function, if absent, a promise is returned.
> Removes a User from the database

### __update(id, data[,cb])__
* `id` {String} User id as defined in schema.
* `data` {Object} Properties to update on User `id` object/instance.
* `cb` {Function} Callback function, if absent, a promise is returned.
> Updates a User object in database & User instance in `.items` array

### __find(obj[,cb])__
* `obj` {Object} Key/value to look for Users.
* `cb` {Function} Callback function, if absent, a promise is returned.
> Find User with mathing key/values pair in the `.items` array


---

## Classes