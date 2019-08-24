const { XMLHttpRequest } = require("xmlhttprequest");

const fillOptions = function (_options = { headers: {} }) {
   const DEFAULT_OPTIONS = {
      method: "GET",
      headers: { "Content-Type": "application/json" }
   };

   const headers = {...DEFAULT_OPTIONS.headers, ..._options.headers};
   const options = {...DEFAULT_OPTIONS, ..._options};
   options.headers = headers;

   return options;
};

const makeRequest = function (url, _options) {
   const options = fillOptions(_options);

   console.error(url);
   const request = new XMLHttpRequest();
   return new Promise((resolve, reject) => {
      request.onload = () => resolve(request);
      request.onerror = () => reject(request);

      request.open(options.method, url, true, options.username, options.password);
      Object.keys(options.headers).forEach(
         k => request.setRequestHeader(k, options.headers[k])
      );
      request.send();
   });
};

module.exports = {
   makeRequest
};