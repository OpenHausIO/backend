# Documentation


## HTTP API
See [postman.json](../postman.json) for API routes.<br />
The collection can be easy imported and is ready-to-use.

## Docker
See the [`DOCKER.md`](./DOCKER.md) for working with docker.<br />
It describes how to import the downloaded backend image, start a container and many more.


## Environment variables
| Name                     | Default value             | Description                                                       |
| ------------------------ | ------------------------- | ----------------------------------------------------------------- |
| DATABASE_HOST            | `127.0.0.1`               | MongoDB Host                                                      |
| DATABASE_PORT            | `27017`                   | MongoDB Port                                                      |
| DATABASE_NAME            | `OpenHaus`                | MongoDB Name                                                      |
| DATABASE_URL             |                           | Full connection url, if set other database settings are ignored   |
| DATABASE_WATCH_CHANGES   | `false`                   | Watch for changes in database and update object item              |
| HTTP_PORT                | `8080`                    | HTTP Server port for the API                                      |
| HTTP_ADDRESS             | `0.0.0.0`                 | HTTP Server Address for the API                                   |
| HTTP_SOCKET              |                           | HTTP Server unix socket path, e.g. `/tmp/open-haus.sock`          |
| LOG_PATH                 | `<cwd>/logs`              | Path where logfiles are stored                                    |
| LOG_LEVEL                | `verbose`                 | Winston log level                                                 |
| LOG_DATEFORMAT           | `yyyy.mm.dd - HH:MM.ss.l` | Dateformat                                                        |
| LOG_TARGET               |                           | Log only specified target, usefull for devs                       |
| NODE_ENV                 | `production`              | Production or Development env?                                    |
| STARTUP_DELAY            | `0`                       | Wait till we do anything                                          |
| COMMAND_RESPONSE_TIMEOUT | `2000`                    | Device command response timeout                                   |
| API_SANITIZE_INPUT       | `true`                    | Sanitize HTTP API Input to prevent XSS                            |
| API_LIMIT_SIZE           | `25`                      | Max reqeust size in mb for API calls                              |
| DEBUG                    |                           |                                                                   |
| GC_INTERVAL              |                           |                                                                   |
| VAULT_MASTER_PASSWORD    |                           | Vault component master Password, need to be set to start OpenHaus |
| VAULT_BLOCK_CIPHER       | `aes-256-cbc`             | Vault encryption method                                           |
| VAULT_AUTH_TAG_BYTE_LEN  | `16`                      | Vault auth tag length in bytes                                    |
| VAULT_IV_BYTE_LEN        | `16`                      | Vault "initial vector" value size in bytes                        |
| VAULT_KEY_BYTE_LEN       | `32`                      | Vault key size in bytes                                           |
| VAULT_SALT_BYTE_LEN      | `16`                      | Vault salt size in bytes                                          |


## Components
- [devices](./components/devices.md)
- [endpoints](./components/endpoints.md)
- [plugins](./components/plugins.md)
- [rooms](./components/rooms.md)

## Helper functions
- [debounce(func, wait[, immediate])](./helper.md#debouncefunc-wait-immediate)
- [extend(target, ...sources)](./helper.md#extendtarget-sources)
- [infinity(worker[,delay])](./helper.md#infintyworker-delay3000)
- [iterate(obj, cb)](./helper.md#iterateobj-cb)
- [mixins(objs, options[, lookup])](./helper.md#mixinsobjs-options-lookup)
- [observe(target[, options, setter, getter])](./helper.md#observetarget-options-setter-getter)
- [promisify(worker, cb)](./helper.md#promisifyworker-cb)
- [queue(counter, cb)](./helper.md#queuecounter-cb)
- [request(url[, options, cb])](./helper.md#requesturloptionscb)
- [sanitize.encode(input[,rules])](./helper.md#sanitizeencodeinputrules)
- [sanitize.decode(input[,rules])](./helper.md#sanitizedecodeinputrules)
- [timeout(time, cb)](./helper.md#timeouttime-cb)

## System
- [components](./system/components.md)
- [hooks](./system/hooks.md)
- [middleware](./system/middleware.md)