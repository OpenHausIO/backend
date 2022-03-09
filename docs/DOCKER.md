# Docker documentation

## Table of contents 
- [Docker documentation](#docker-documentation)
  - [Table of contents](#table-of-contents)
  - [Images](#images)
    - [1) Import the image](#1-import-the-image)
    - [2) Export a image](#2-export-a-image)
    - [3) Build the backend image<sup>*</sup>](#3-build-the-backend-imagesupsup)
  - [Container](#container)
    - [4) Start a backend container](#4-start-a-backend-container)
    - [5) Use `docker-compose up`<sup>*</sup>](#5-use-docker-compose-upsupsup)

---

## Images
### 1) Import the image
```sh
gzip -cdr docker-open-haus.tgz | docker image import - openhaus/backend
```

### 2) Export a image
```sh
docker image save openhaus/backend:latest | gzip > docker-open-haus.tgz
```

### 3) Build the backend image<sup>*</sup>
```sh
npm run build:docker-image
```

----


## Container
### 4) Start a backend container
```sh
docker run --rm --name=backend --env=DATABASE_HOST=<database host> --expose 8080 openhaus/backend
```
See [environment variables](./README.md) for more configuration.

> To import the sample database dump:
> `docker cp demo-database.gz  backend_database_1:/`
> 
> `docker exec -i backend_database_1 mongorestore --archive=/demo-database.gz`
> 
> See https://davejansen.com/how-to-dump-restore-a-mongodb-database-from-a-docker-container/ for more information

### 5) Use `docker-compose up`<sup>*</sup>
```sh
docker-compose up
```

----
<sup>*</sup> Commands must be run inside the source code folder.
(Download it from github: https://github.com/OpenHausIO/backend)