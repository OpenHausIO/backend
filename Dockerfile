# https://dev.to/alex_barashkov/using-docker-for-nodejs-in-development-and-production-3cgp
# https://medium.com/@kahana.hagai/docker-compose-with-node-js-and-mongodb-dbdadab5ce0a

# The instructions for the first stage
FROM node:16-alpine as builder

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

RUN apk --no-cache add python3 make g++

COPY ./package*.json ./
RUN npm install


# ------------------------------------


# The instructions for second stage
FROM node:16-alpine

WORKDIR /opt/OpenHaus/backend
COPY --from=builder node_modules node_modules
RUN apk --no-cache add openssl

COPY . ./
#COPY ./package.json ./

#ENV HTTP_PORT=8080
ENV NODE_ENV=production
#ENV DB_HOST=10.0.0.1
#EXPOSE 8080

CMD ["node", "index.js"]
