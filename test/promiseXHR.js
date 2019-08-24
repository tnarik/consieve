const chaiAsPromised = require("chai-as-promised")
const { assert, expect } = require("chai").use(chaiAsPromised);
const rewire = require("rewire")
const nock = require('nock');

const { makeRequest } = require("../lib/promiseXHR");
const promiseXHR = rewire("../lib/promiseXHR");

var valid = nock('http://www.valid.com')
                .get('/')
                .reply(200, {
                 })
                .persist();

var invalid = nock('http://www.invalid.com')
                .get('/')
                .reply(500, {
                 })
                .persist();

var error = nock('http://www.error.com')
                .get('/')
                .replyWithError({ boom: "boom!"})
                .persist();

describe("promiseXHR", () => {
   describe("fillOptions", () => {
      const fillOptions = promiseXHR.__get__("fillOptions")
      it("should exist", () => expect(fillOptions.name).to.equal("fillOptions") );
      describe("by default", () => {
         it("should provide the method GET", () =>
            expect(fillOptions().method).to.equal("GET") );
         it("should provide the Content-Type header", () =>
            expect(fillOptions().headers).to.have.property("Content-Type", "application/json") );
      });
      describe("when passing options", () => {
         const optionsPOST = { method: "POST" }
         const optionsCTTest = { headers: {"Content-Type": "test/test"}}
         const optionsCTTestLowerCase = { headers: {"content-type": "test/test"}}
         const optionsAL = { headers: {"Accept-Language": "fr-CA"}}
         const optionsUsername = { username: "AUsername"}

         it("should override the method", () =>
            expect(fillOptions(optionsPOST).method).to.equal("POST") );
         it("should override a header with the same casing", () => {
            expect(Object.keys(fillOptions(optionsCTTest).headers)).to.have.lengthOf(1)
            expect(fillOptions(optionsCTTest).headers).to.have.property("Content-Type", "test/test")
         });
         it("should override a header with different casing", () => {
            expect(Object.keys(fillOptions(optionsCTTestLowerCase).headers)).to.have.lengthOf(1);
            expect(fillOptions(optionsCTTestLowerCase).headers).to.have.property(...Object.entries(optionsCTTestLowerCase.headers)[0])
         });
         it("should add a new header if passed", () => {
            expect(Object.keys(fillOptions(optionsAL).headers)).to.have.lengthOf(2);
            expect(fillOptions(optionsAL).headers).to.have.property(...Object.entries(optionsAL.headers)[0]);
         });
         it("should add a new option if passed", () =>
            expect(fillOptions(optionsUsername)).to.have.property(...Object.entries(optionsUsername)[0])
         );
      })
   });

   describe("makeRequest", () => {
      beforeEach( () => {
      });

      it("should exist", () => expect(makeRequest.name).to.equal("makeRequest") );
      it("should return a fulfilled promise for a valid URL", () => {
         const request = makeRequest("http://www.valid.com")
         return expect(request).to.eventually.be.fulfilled.and.have.property('status', 200)
      });
      it("should return a fulfilled promise for an invalid URL", () => {
         const request = makeRequest("http://www.invalid.com")
         return expect(request).to.eventually.be.fulfilled.and.have.property('status', 500)
      });
      it("should return a rejected promise for an error", () => {
         const request = makeRequest("http://www.error.com")
         return expect(request).to.eventually.be.rejected.and.have.property('status', 0)
            .then( () =>
               expect(request).to.eventually.be.rejected.and.have.property('readyState', 4)
            )
      });
   });
});