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

### 3) Container/Docker images
1) Build the container image
2) Start a new container with the previously created image

1 - Build the container image
```sh
npm run build:docker-image
```

2.a - Start a container with the image
```sh
docker run --rm --name=backend --env=DATABASE_HOST=<database host> --expose 8080 openhaus/backend
```
See [environment variables](./docs/README.md) for more configuration.

2.b - Use `docker-compose up`
```sh
docker-compose up
```
> To import the sample database dump, use `docker exec -i backend mongorestore ./dump-OpenHaus.tgz`. See https://davejansen.com/how-to-dump-restore-a-mongodb-database-from-a-docker-container/ for more information
---

## Documentation
Most documentation can be found in [docs](./docs).<br />
The source code it self is very well documented.

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