const chaiAsPromised = require("chai-as-promised")
const { assert, expect } = require("chai").use(chaiAsPromised);
const rewire = require("rewire")
const nockServer = require('./assets/server');

const { makeRequest } = require("../lib/promiseXHR");
const promiseXHR = rewire("../lib/promiseXHR");


describe("promiseXHR", () => {
   describe("mergeOptions", () => {
      const mergeOptions = promiseXHR.__get__("mergeOptions")
      it("should exist", () => expect(mergeOptions.name).to.equal("mergeOptions") );

      describe("by default", () => {
         it("should provide the method GET", () =>
            expect(mergeOptions().method).to.equal("GET") );
         it("should provide the Content-Type header", () =>
            expect(mergeOptions().headers).to.have.property("Content-Type", "application/json") );
      });

      describe("when passing options", () => {
         const optionsPOST = { method: "POST" }
         const optionsCTTest = { headers: {"Content-Type": "test/test"}}
         const optionsCTTestLowerCase = { headers: {"content-type": "test/test"}}
         const optionsAL = { headers: {"Accept-Language": "fr-CA"}}
         const optionsUsername = { username: "AUsername"}

         it("should override the method", () =>
            expect(mergeOptions(optionsPOST).method).to.equal("POST") );
         it("should override a header with the same casing", () => {
            expect(Object.keys(mergeOptions(optionsCTTest).headers)).to.have.lengthOf(1)
            expect(mergeOptions(optionsCTTest).headers).to.have.property("Content-Type", "test/test")
         });
         it("should override a header regardless of casing", () => {
            expect(Object.keys(mergeOptions(optionsCTTestLowerCase).headers)).to.have.lengthOf(1);
            expect(mergeOptions(optionsCTTestLowerCase).headers).to.have.property(...Object.entries(optionsCTTestLowerCase.headers)[0])
         });
         it("should add a new header if passed", () => {
            expect(Object.keys(mergeOptions(optionsAL).headers)).to.have.lengthOf(2);
            expect(mergeOptions(optionsAL).headers).to.have.property(...Object.entries(optionsAL.headers)[0]);
         });
         it("should add a new option if passed", () =>
            expect(mergeOptions(optionsUsername)).to.have.property(...Object.entries(optionsUsername)[0])
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