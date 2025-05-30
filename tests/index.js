const mongodb = require("mongodb");
const path = require("path");
const { describe, it, after } = require("mocha");
const { channel } = require("../system/component/class.events.js");
const crypto = require("crypto");

const env = require("dotenv").config({
    path: path.resolve(process.cwd(), ".env")
});


if (env.error) {
    env.parsed = {};
}

console.clear();

process.env = Object.assign({
    UUID: crypto.randomUUID(),
    DATABASE_HOST: "127.0.0.1",
    DATABASE_PORT: "27017",
    DATABASE_NAME: crypto.randomBytes(8).toString("hex"),
    DATABASE_URL: "",
    DATABASE_WATCH_CHANGES: "false",
    LOG_PATH: path.resolve(process.cwd(), "logs"),
    LOG_LEVEL: "verbose",
    LOG_DATEFORMAT: "yyyy.mm.dd - HH:MM:ss.l",
    LOG_SUPPRESS: "true",
    LOG_TARGET: "",
    NODE_ENV: "test",
    DEBUG: "",
    VAULT_MASTER_PASSWORD: crypto.randomBytes(24).toString("hex"),
    VAULT_BLOCK_CIPHER: "aes-256-cbc",
    VAULT_AUTH_TAG_BYTE_LEN: "16",
    VAULT_IV_BYTE_LEN: "16",
    VAULT_KEY_BYTE_LEN: "32",
    VAULT_SALT_BYTE_LEN: "16",
    USERS_BCRYPT_SALT_ROUNDS: "12",
    USERS_JWT_SECRET: crypto.randomBytes(24).toString("hex"),
    USERS_JWT_ALGORITHM: "HS384",
    MQTT_BROKER_VERSION: "3"
}, env.parsed, process.env);


if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = `mongodb://${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`;
}


describe("Database", () => {

    it(`- Should connect to ${process.env.DATABASE_URL}`, (done) => {

        mongodb.MongoClient.connect(process.env.DATABASE_URL, {
            //useUnifiedTopology: true,
            //useNewUrlParser: true
        }).then((client) => {

            /*
            // mocha should handle this with specific error code
            client.on("serverClosed", () => {
                process.exit();
            });
            */

            mongodb.connection = client;
            mongodb.client = client.db();

            done();

            require("./helper/index.js");
            require("./system/index.js");
            require("./components/index.js");
            //require("./http-api/index.js");

        }).catch((err) => {

            console.error(err);

            done(err);
            process.exit(1);

        });
    });

});

after(async () => {

    channel.close(); // close brodcast channel, see #6 & #550
    await mongodb.client.dropDatabase();
    await mongodb.connection.close();

});