# Documentation


## HTTP API
See [postman.json](../postman.json) for API routes.<br />
The collection can be easy imported and is read-to-use.

## Environment variables
| Name                     | Default value                   | Description                                                                                                                            |
| ------------------------ | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| BCRYPT_SALT_ROUNDS       | `12`                            | How any rounds to generate the password salt                                                                                           |
| PASSWORD_MIN_LENGTH      | `16`                            | Password min length                                                                                                                    |
| DATABASE_HOST            | `127.0.0.1`                     | MongoDB Host                                                                                                                           |
| DATABASE_PORT            | `27017`                         | MongoDB Port                                                                                                                           |
| DATABASE_NAME            | `OpenHaus`                      | MongoDB Name                                                                                                                           |
| DATABASE_TIMEOUT         | `5`                             | Timeout for connection                                                                                                                 |
| DATABASE_URL             |                                 | Full connection url, if set other database settings are ignored                                                                        |
| HTTP_PORT                | `8080`                          | HTTP Server port for the API                                                                                                           |
| HTTP_ADDRESS             | `0.0.0.0`                       | HTTP Server Address for the API                                                                                                        |
| LOG_PATH                 | `<cwd>/logs`                    | Path where logfiles are stored                                                                                                         |
| LOG_LEVEL                | `verbose`                       | Winston log level                                                                                                                      |
| LOG_DATEFORMAT           | `yyyy.mm.dd - HH:MM.ss.l`       | Dateformat                                                                                                                             |
| LOG_TARGET               |                                 | Log only specified target, usefull for devs                                                                                            |
| NODE_ENV                 | `production`                    | Production or Development env?                                                                                                         |
| STARTUP_DELAY            | `0`                             | Wait till we do anything                                                                                                               |
| COMMAND_RESPONSE_TIMEOUT | `2000`                          | Device command response timeout                                                                                                        |
| API_SANITIZE_INPUT       | `true`                          | Sanitize HTTP API Input to prevent XSS                                                                                                 |
| API_LIMIT_SIZE           | `25`                            | Max reqeust size in mb for API calls                                                                                                   |
| DEBUG                    |                                 |                                                                                                                                        |
| GC_INTERVAL              |                                 |                                                                                                                                        |
| CORS_ENABLED             | `true`                          | Enable CORS response headers, see: https://developer.mozilla.org/en/docs/Web/HTTP/CORS                                                 |
| CORS_ORIGIN              | `*`                             | Where does the request come from: https://developer.mozilla.org/en/docs/Web/HTTP/Headers/Access-Control-Allow-Origin                   |
| CORS_HEADERS             | `X-AUTH-TOKEN, *`               | What custom headers is the client allowed to send: https://developer.mozilla.org/en/docs/Web/HTTP/Headers/Access-Control-Allow-Headers |
| CORS_METHODS             | `GET, PUT, PATCH, DELETE, POST` | What HTTP Methods are allowed: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Methods                  |

## Components
- [devices](./components/devices.md)
- [endpoints](./components/endpoints.md)
- [plugins](./components/plugins.md)
- [rooms](./components/rooms.md)
- [<span style="color:gray">scenes</span>](./components/scenes.md)
- [users](./components/users.md)

## Helper functions
- [debounce(func, wait[, immediate])](./helper.md#debouncefunc-wait-immediate)
- [extend(target, ...sources)](./helper.md#extendtarget-sources)
- [filter(obj, predicate)](./helper.md#filterobj-predicate)
- [iterate(obj, cb)](./helper.md#iterateobj-cb)
- [mixins(objs, options[, lookup])](./helper.md#mixinsobjs-options-lookup)
- [observe(target[, options, setter, getter])](./helper.md#observetarget-options-setter-getter)
- [promisify(worker, cb)](./helper.md#promisifyworker-cb)
- [queue(counter, cb)](./helper.md#queuecounter-cb)
- [timeout(time, cb)](./helper.md#timeouttime-cb)

## System
- [components](./system/components.md)
- [hooks](./system/hooks.md)
- [middleware](./system/middleware.md)