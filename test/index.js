const { assert, expect } = require("chai");
const rewire = require("rewire")

const { makeRequest } = rewire("../lib/promiseXHR");
const promiseXHR = rewire("../lib/promiseXHR");

describe("promiseXHR", () => {
   describe("makeRequest", () => {
      it("should exist", () => {
         expect(makeRequest).to.not.be.undefined;
         expect(makeRequest.name).to.equal("makeRequest");
      });
      it("should to that thing");
   });

   describe("fillOptions", () => {
      const fillOptions = promiseXHR.__get__("fillOptions")
      it("should exist", () => {
         expect(fillOptions).to.not.be.undefined;
         expect(fillOptions.name).to.equal("fillOptions");
      });
      describe("by default", () => {
         it("should provide the method GET", () => {
            expect(fillOptions().method).to.equal("GET")
         });
         it("should provide the Content-Type header", () => {
            expect(fillOptions().headers).to.have.property("Content-Type", "application/json")
         });
      });
      describe("when passing options", () => {
         it("should allow overriding the method", () => {
            expect(fillOptions({ method: "POST" }).method).to.equal("POST")
         });
         it("should allow overriding the method", () => {
            expect(fillOptions({ headers: {"content-type": "asdf"}}).headers).to.have.property("Content-Type", "application/json")
         });
      })
   });
});