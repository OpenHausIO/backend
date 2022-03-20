const { describe, it } = require("mocha");
const assert = require("assert");
const { ClientRequest } = require("http");
const request = require("../../helper/request");

describe("helper/request", () => {

    it("- [GET] Return http status code 200", (done) => {
        request("https://httpbin.org/status/200", (err, { status }) => {

            assert(err === null);
            assert(status, 200);

            done();

        });
    });

    it("- [GET] Do not follow redirect", (done) => {
        request("http://127.0.0.1/redirect-to?url=http%3A%2F%2Fexample.com&status_code=301", {
            followRedirects: false
        }, (err, { status, headers }) => {

            assert(err === null);
            assert(status === 301);
            assert(headers.location === "http://example.com");

            done();

        });
    });

    it("- [GET] Follow redirect", (done) => {
        request("http://127.0.0.1/redirect-to?url=http%3A%2F%2Fexample.com&status_code=301", {
            followRedirects: true
        }, (err, { body, status, headers }) => {

            assert(err === null);
            assert(status === 200);
            assert(body.length === Number(headers["content-length"]));

            done();

        });
    });

    it("- returns a http request object", () => {

        let req = request("http://127.0.0.1/");

        assert(req instanceof ClientRequest);

    });

});