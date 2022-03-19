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

### 2) Docker
Read the [docker documentation](./docs/DOCKER.md) to get started.
There is describen how to work with OpenHaus (backend) & docker.

---

## Documentation
Most documentation can be found in [docs](./docs).<br />
The source code it self is very well documented.

---

## Note
OpenHaus is in a very early development state.<br />
A good start is that you fireup [postman](https://www.postman.com/) import the collection (`postman.json`) and start to get familiar with the HTTP API. For better understanding, see the [📁 `components`](./components) folder and browser through the `index.js` files. Here is the schema defined how a "device", "room" or "user" object looks like.

I hope i found soon a solution to document things better...

## Contribution
If you have questions, want to contribute or just wanna have a talk, open a new issue.