#!/usr/bin/env node

// For Native Messaging the specific path is required
//#!/Users/tnarik/.nvm/versions/node/v10.15.0/bin/node
// v8.9.0 on the iMac
const nativeMessage = require("chrome-native-messaging");
const urlencode = require("urlencode");
const path = require("path");
const fs = require("fs");
const Conf = require("conf");
const xml2js = require("xml2js");

const { makeRequest } = require("./promiseXHR");


const logFile = "/Users/tnarik/Desktop/nodeconfla/log-stdio-test.log"
const log = msg => {
   fs.appendFileSync(logFile, msg);
}

/*
   fast-xml-parser: turns XML into JS, therefore it is no good for unknown structures
   xml2js: similar to fast-xml-parser (just parses the DOM)
   xml2js-xpath: used with the above, seems to work well when elements are not contained within themselves (a div containing divs)
   wgxpath: uses regex and therefore desn't go deep into structures
*/
const {
   sync
} = require("@lecafeautomatique/slimdom-sax-parser");


const {
   //evaluateXPath,
   //evaluateXPathToBoolean,
   //evaluateXPathToString,
   evaluateXPathToNodes,
   domFacade
} = require("fontoxpath");

const config = new Conf();
console.log(config);

if (!config.has("nm_installed")) {
   console.log("Should install the nm manifest");
   console.log(config.set("nm_installed", true));
}

const credentials = { username: process.env.CUSER, password: process.env.CPASS };

const createFile = (space, title, content) => {
   const dir = path.join(space, title);
   log(`creating path with ${space} and ${title}: "${dir}"\n`);
   if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
   }
   const filePath = path.join(dir, "rawContent")
   fs.writeFileSync(filePath, content);
   return filePath;
};

function fetchPage(space, _title, host = process.env.CHOST, push = () => {}, done = () => {}) {
   log(`${space} and ${_title}\n`);

   const title = urlencode(_title).replace(/%20/g, "+");
   console.error(title);
   log(`${title}\n`);

   log(`https://${host}/tempcps/rest/api/content?spaceKey=${space}&title=${title}\n`);
   log(JSON.stringify(credentials));
   makeRequest(`https://${host}/tempcps/rest/api/content?spaceKey=${space}&title=${title}`, credentials)
      .then(request => {
         console.error(`Received: ${request.status}`);
         log("\nresponse received\n");
         log(`${request.status}\n`);

         if (request.status === 200) {
            const responseJSON = JSON.parse(request.responseText);
            const { id } = responseJSON.results[0];
            console.error(id);
            const url = responseJSON.results[0]._links.self; // eslint-disable-line no-underscore-dangle
            return ([id, url]);
         }

         log("1st fetch issue\n");
         throw (request);
      })
      .then(([id, url]) => {
         log(`${id} and ${url}\n`);
         log("second part\n");
         console.error(`and 2, towards ${url}`);
         log(JSON.stringify(credentials));
         return (makeRequest(`${url}?expand=body.storage`, credentials));
      })
      .then(request => {
         console.error(`Received: ${request.status}`);
         log("\nresponse received 2\n");
         if (request.status === 200) {
            const responseJSON = JSON.parse(request.responseText);
            const pageStorage = `<root>${responseJSON.body.storage.value}</root>`;
            xml2js.parseString(pageStorage, { explicitRoot: false }, (err, result) => {
               //console.error(result);
               // console.error(result["ac:structured-macro"][0]["ac:rich-text-body"])
               log(result);
               push({ response: "that response from the native app" });
               log("\npushed\n");
               done();
               log("done\n");

               createFile(space, title, pageStorage);
            });
         } else {
            log("2nd fetch issue\n");
            throw (request);
         }
      })
      .catch(error => {
         log("fetch error\n");
         log(error.status);
         console.error("a horrible error");
         console.error("Error fetching page");
         console.error(error.status);
         console.error(error);
         push({ response: "AN ERROR from the native app" });
         done();
      });
}


// Works, but there is no order

function withFonto(filePath) {
   //const DomParser = require("dom-parser");
   //const parser = new DomParser();

   fs.readFile(filePath, "utf8", (err, data) => {
      //console.error(data);
      for (let i = 0; i < 1; i++) {
         // slimdom-sax-parser is quite strict and requires injection of additional namespaces and entities

         const options = {
            additionalNamespaces: {
               ac: "http://www.atlassian.com/schema/confluence/4/ac/",
               ri: "http://www.atlassian.com/schema/confluence/4/ri/"
            },
            additionalEntities: {
               nbsp: 160
            }
         };
         const dom = sync(data, options);

         console.error(evaluateXPathToNodes("//ac:structured-macro", dom, domFacade, null,
            {
               namespaceResolver: prefix => options.additionalNamespaces[prefix]
            }).length);
         console.error(evaluateXPathToNodes("//ac:rich-text-body/ac:structured-macro[@ac:name='plantuml']", dom, domFacade, null,
            {
               namespaceResolver: prefix => options.additionalNamespaces[prefix]
            }).length);
         console.error(evaluateXPathToNodes("//ac:structured-macro[@ac:name='plantuml']", dom, domFacade, null,
            {
               namespaceResolver: prefix => options.additionalNamespaces[prefix]
            }).length);
         console.error(evaluateXPathToNodes("//ac:structured-macro[@ac:name='jira']", dom, domFacade, null,
            {
               namespaceResolver: prefix => options.additionalNamespaces[prefix]
            }).length);
      }
   });
}


/*
process.argv.forEach((val, index) => {
   fs.appendFileSync('electron-stdio-test.log', `${val}\n`)
});
*/

function processNative(msg, push, done) {
   log(JSON.stringify(msg));
   fetchPage(msg.space, msg.title, msg.host, push, done);
}

if (require.main === module) {
   log("\nget.js used directly =>\n");
   log(`${process.argv.join("\n")}`);
   if (process.argv.length > 2) {
      if (process.argv[2] === "chrome-extension://fehcjibefedmpdhalkdlpeeneojhcanc/") {
         log("this is the extension calling");

         process.stdin
            .pipe(new nativeMessage.Input())
            .pipe(new nativeMessage.Transform(processNative))
            .pipe(new nativeMessage.Output())
            .pipe(process.stdout);
      }
   } else {
               withFonto(path.join(__dirname, "..", "a.xml"));

   }
} else {
   console.error("No main module");
   log(`${process.argv.join("\n")}`);
   /*
   process.stdin
      .pipe(new nativeMessage.Input())
      .pipe(new nativeMessage.Transform(processNative))
      .pipe(new nativeMessage.Output())
      .pipe(process.stdout);
   */
}

module.exports = {
   fetchPage,
   createFile,
   withFonto
}