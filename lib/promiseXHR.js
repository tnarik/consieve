const { XMLHttpRequest } = require("xmlhttprequest");

const mergeOptions = function (_options = { headers: {} }) {
   const DEFAULT_OPTIONS = {
      method: "GET",
      headers: { "Content-Type": "application/json" }
   };

   let headers = { ...DEFAULT_OPTIONS.headers, ..._options.headers };
   const consolidatedKeys = Object.keys(headers).reduce((keys, k) => {
      keys[k.toLowerCase()] = k; // eslint-disable-line no-param-reassign
      return keys;
   }, {});
   headers = Object.keys(consolidatedKeys).reduce((values, k) => {
      values[consolidatedKeys[k]] = headers[consolidatedKeys[k]]; // eslint-disable-line no-param-reassign
      return values;
   }, {});

   const options = { ...DEFAULT_OPTIONS, ..._options };
   options.headers = headers;

   return options;
};

const makeRequest = function (url, _options) {
   const options = mergeOptions(_options);

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