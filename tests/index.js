const mongodb = require("mongodb");
const path = require("path");
const { describe, it, after } = require("mocha");

const env = require("dotenv").config({
    path: path.resolve(process.cwd(), ".env")
});


if (env.error) {
    env.parsed = {};
}

process.env = Object.assign({
    UUID: "",
    DATABASE_HOST: "127.0.0.1",
    DATABASE_PORT: "27017",
    DATABASE_NAME: "OpenHaus-unit-tests",
    DATABASE_URL: "",
    DATABASE_WATCH_CHANGES: "false",
    LOG_PATH: path.resolve(process.cwd(), "logs"),
    LOG_LEVEL: "verbose",
    LOG_DATEFORMAT: "yyyy.mm.dd - HH:MM.ss.l",
    LOG_SUPPRESS: "true",
    LOG_TARGET: "",
    NODE_ENV: "test",
    DEBUG: "",
}, env.parsed, process.env);


if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = `mongodb://${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`;
}


describe("Database", () => {

    it(`- Should connect to ${process.env.DATABASE_URL}`, (done) => {
        mongodb.MongoClient.connect(process.env.DATABASE_URL, {
            useUnifiedTopology: true,
            useNewUrlParser: true
        }, (err, client) => {

            if (err) {
                return done(err);
            }

            //assert(err, null);

            mongodb.connection = client;
            mongodb.client = client.db();

            done(err);

            require("./helper/index.js");
            require("./system/index.js");
            //require("./components/index.js");

        });
    });

});

after((done) => {
    mongodb.connection.close(() => {
        done();
    });
});