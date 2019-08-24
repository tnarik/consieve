const { assert, expect } = require("chai");
const rewire = require("rewire")

const { makeRequest } = require("../lib/promiseXHR");
const promiseXHR = rewire("../lib/promiseXHR");

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
         it("should override a header as case sensitive", () => {
            expect(Object.keys(fillOptions(optionsCTTest).headers)).to.have.lengthOf(1)
            expect(fillOptions(optionsCTTest).headers).to.have.property("Content-Type", "test/test")
         });
         it("should override a header as case insensitive", () => {
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
      it("should exist", () => expect(makeRequest.name).to.equal("makeRequest") );
      it("should return a promise", () =>
         expect(makeRequest("http://www.google.com")).to.be.a('promise')
      );
   });
});