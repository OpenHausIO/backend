# Backend
The backend represents the Web HTTP API for the OpenHaus ecosystem.
Here are all devices/endpoints stored, messages/commands distributed and states managed.

---

## Requirments
- node.js: https://nodejs.org
- mongodb: https://www.mongodb.com

---

## Installation

### 1) Manual (Compile & Build)

```sh
git clone https://github.com/OpenHausIO/backend.git
cd backend
npm install --production
```

### 2) Pre-compiled 
@Todo

---

## Documentation
@Todo The code itself is (mostly) documentated.
Currently im searching for a solution to use the comments in the code to autogenerate a documention out of it.

### Environment variables
| Name                     | Default value             | Description                                                     |
| ------------------------ | ------------------------- | --------------------------------------------------------------- |
| BCRYPT_SALT_ROUNDS       | `12`                      | How any rounds to generate the password salt                    |
| PASSWORD_MIN_LENGTH      | `16`                      | Password min length                                             |
| DATABASE_HOST            | `127.0.0.1`               | MongoDB Host                                                    |
| DATABASE_PORT            | `27017`                   | MongoDB Port                                                    |
| DATABASE_NAME            | `OpenHaus`                | MongoDB Name                                                    |
| DATABASE_TIMEOUT         | `5`                       | Timeout for connection                                          |
| DATABASE_URL             |                           | Full connection url, if set other database settings are ignored |
| HTTP_PORT                | `8080`                    | HTTP Server port for the API                                    |
| HTTP_ADDRESS             | `0.0.0.0`                 | HTTP Server Address for the API                                 |
| LOG_PATH                 | `<cwd>/logs`              | Path where logfiles are stored                                  |
| LOG_LEVEL                | `verbose`                 | Winston log level                                               |
| LOG_DATEFORMAT           | `yyyy.mm.dd - HH:MM.ss.l` | Dateformat                                                      |
| LOG_TARGET               |                           | Log only specified target, usefull for devs                     |
| NODE_ENV                 | `production`              | Production or Development env?                                  |
| STARTUP_DELAY            | `0`                       | Wait till we do anything                                        |
| COMMAND_RESPONSE_TIMEOUT | `2000`                    | Device command response timeout                                 |
| API_SANITIZE_INPUT       | `true`                    | Sanitize HTTP API Input to prevent XSS                          |
| API_LIMIT_SIZE           | `25`                      | Max reqeust size in mb for API calls                            |
| DEBUG                    |                           |                                                                 |
| GC_INTERVAL              |                           |                                                                 |



---

## Milestones
See [MILESTONES.md](./MILESTONES.md) to see what we want to achive/plans in upcoming verions

---

## Note
OpenHaus is in a very early development state.<br />
A good start is that you fireup [postman](https://www.postman.com/) import the collection (`postman.json`) and start to get familiar with the HTTP API. For better understanding, see the [📁 `components`](./components) folder and browser through the `index.js` files. Here is the schema defined how a "device", "room" or "user" object looks like.

I hope i found soon a solution to document things better...

## Contribution
If you have questions, want to contribute or just wanna have a talk, open a new issue.