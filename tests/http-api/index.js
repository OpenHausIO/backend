const { describe, it } = require("mocha");
const newman = require("newman");
const { fork } = require("child_process");
const path = require("path");
const crypto = require("crypto");
const assert = require("assert");

const collection = require("../../postman.json");


describe("HTTP API", function () {

    this.timeout(100000);

    //let HTTP_PORT = crypto.randomInt(2048, 1024);
    let child = null;

    it("- Should start OpenHaus", (done) => {

        child = fork(path.resolve(process.cwd(), "index.js"), {
            silent: true,
            env: Object.assign({}, process.env, {
                UUID: crypto.randomUUID(),
                DATABASE_NAME: crypto.randomBytes(8).toString("hex"),
                VAULT_MASTER_PASSWORD: crypto.randomBytes(24).toString("hex"),
                USERS_JWT_SECRET: crypto.randomBytes(24).toString("hex")
            })
        });

        child.on("exit", (code) => {
            console.error(`child exited, code=${code}`);
            child = null;
        });

        child.on("spawn", () => {
            setTimeout(done, 1500);
        });

        child.on("error", (err) => {
            done(err);
        });

    });


    // https://gist.github.com/davfive/eae043135ed98b9647ad631bbfc1ab38
    // https://github.com/postmanlabs/newman/wiki/Newman-Run-Events
    it("- Should not have any items in summary.run.failres array", (done) => {

        // https://www.npmjs.com/package/newman#newman-options
        let emitter = newman.run({
            collection,
            //reporters: "json",
            //timeoutRequest: 30000
            delayRequest: 200
        });

        emitter.on("beforeItem", (err, { item }) => {

            if (!child) {
                emitter?.abort();
            }

            let { request } = item;
            console.log(`\t[${request.method}] ${item.name} (${request.url})`);

        });

        emitter.once("exception", (err, { error }) => {
            console.error("Exception happend", err || error);
            done(err || error);
        });

        emitter.once("done", (err, summary) => {
            try {
                if (err || summary.error) {

                    done(err || summary.error);

                } else {

                    summary.run.failures.forEach(({ source: { name, request }, error }) => {
                        console.error(`[${request.method}] ${request.url.toString()} (${name})`, error.message);
                    });

                    assert.equal(summary.run.failures.length, 0);

                    done();

                }
            } catch (err) {

                done(err);

            }
        });

    });


    // ensure to kill the backend
    // so that github actions complete
    this.afterAll(() => {
        child?.kill();
    });

});