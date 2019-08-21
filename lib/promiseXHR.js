const { XMLHttpRequest } = require("xmlhttprequest");

const fillOptions = function (options = { headers: {} }) {
   const DEFAULT_OPTIONS = {
      method: "GET",
      headers: { "Content-Type": "application/json" }
   };

   const headers = Object.assign({}, DEFAULT_OPTIONS.headers, options.headers);
   options = Object.assign({}, DEFAULT_OPTIONS, options);
   options.headers = headers;

   return options;
};

const makeRequest = function (url, options) {
   options = fillOptions(options);

   console.error(url);
   const request = new XMLHttpRequest();
   return new Promise((resolve, reject) => {
      request.onload = () => resolve(request);
      request.onerror = () => reject(request);

      request.open(options.method, url, true, options.user, options.password);
      Object.keys(options.headers).forEach(
         k => request.setRequestHeader(k, options.headers[k])
      );
      request.send();
   });
};

module.exports = makeRequest;