#!/Users/tnarik/.nvm/versions/node/v10.15.0/bin/node

//# ! /usr/bin/env node

// v8.9.0 on the iMac
const nativeMessage = require("chrome-native-messaging");
const urlencode = require("urlencode");
const path = require("path");
const fs = require("fs");

const Conf = require("conf");


const xml2js = require("xml2js");
/*
const xpath = require("xml2js-xpath"); // But this is no real XPATH (doesn't find ALL elements when using //, for instance)
const {
   sync
//slimdom,
//createHandler
} = require("slimdom-sax-parser");
const {
   //evaluateXPath,
   //evaluateXPathToBoolean,
   //evaluateXPathToString,
   evaluateXPathToNodes,
   domFacade
} = require("fontoxpath");
*/
const config = new Conf();
console.log(config);

if (!config.has("nm_installed")) {
   console.log("Should install the nm manifest");
   console.log(config.set("nm_installed", true));
}


const username = process.env.CUSER;
const password = process.env.CPASS;
const credentials = { username, password };


const {
   performance,
   PerformanceObserver
} = require("perf_hooks");
// const asyncHooks = require("async_hooks");
const makeRequest = require("./promiseXHR");

const persistData = (p1, p2, content) => {
   fs.appendFileSync("/Users/tnarik/Desktop/nodeconfla/log-stdio-test.log", `creating path with ${p1} and ${p2}\n`);
   const dir = path.join(p1, p2);
   fs.appendFileSync("/Users/tnarik/Desktop/nodeconfla/log-stdio-test.log", `so... ${dir}\n`);
   if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
   }

   fs.writeFileSync(path.join(dir, "content"), content);
};

function fetchFromTitle(space, _title, host = process.env.CHOST, push = () => {}, done = () => {}) {
   fs.appendFileSync("/Users/tnarik/Desktop/nodeconfla/log-stdio-test.log", `${space} and ${_title}\n`);

   const title = urlencode(_title).replace(/%20/g, "+");
   console.error(title);
   fs.appendFileSync("/Users/tnarik/Desktop/nodeconfla/log-stdio-test.log", `${title}\n`);

   fs.appendFileSync("/Users/tnarik/Desktop/nodeconfla/log-stdio-test.log", `https://${host}/tempcps/rest/api/content?spaceKey=${space}&title=${title}\n`);
   fs.appendFileSync("/Users/tnarik/Desktop/nodeconfla/log-stdio-test.log", JSON.stringify(credentials));
   makeRequest(`https://${host}/tempcps/rest/api/content?spaceKey=${space}&title=${title}`, credentials)
      .then(request => {
         console.error(`Received: ${request.status}`);
         fs.appendFileSync("/Users/tnarik/Desktop/nodeconfla/log-stdio-test.log", "\nresponse received\n");
         fs.appendFileSync("/Users/tnarik/Desktop/nodeconfla/log-stdio-test.log", `${request.status}\n`);

         if (request.status === 200) {
            const responseJSON = JSON.parse(request.responseText);
            const { id } = responseJSON.results[0];
            console.error(id);
            const url = responseJSON.results[0]._links.self; // eslint-disable-line no-underscore-dangle
            return ([id, url]);
         }

         fs.appendFileSync("/Users/tnarik/Desktop/nodeconfla/log-stdio-test.log", "1st fetch issue\n");
         throw (request);
      })
      .then(([id, url]) => {
         fs.appendFileSync("/Users/tnarik/Desktop/nodeconfla/log-stdio-test.log", `${id} and ${url}\n`);
         fs.appendFileSync("/Users/tnarik/Desktop/nodeconfla/log-stdio-test.log", "second part\n");
         console.error(`and 2, towards ${url}`);
         fs.appendFileSync("/Users/tnarik/Desktop/nodeconfla/log-stdio-test.log", JSON.stringify(credentials));
         return (makeRequest(`${url}?expand=body.storage`, credentials));
      })
      .then(request => {
         console.error(`Received: ${request.status}`);
         fs.appendFileSync("/Users/tnarik/Desktop/nodeconfla/log-stdio-test.log", "\nresponse received 2\n");
         if (request.status === 200) {
            const responseJSON = JSON.parse(request.responseText);
            const pageStorage = `<root>${responseJSON.body.storage.value}</root>`;
            xml2js.parseString(pageStorage, { explicitRoot: false }, (err, result) => {
               console.error(result);
               // console.error(result["ac:structured-macro"][0]["ac:rich-text-body"])
               fs.appendFileSync("/Users/tnarik/Desktop/nodeconfla/log-stdio-test.log", result);
               push({ response: "that response from the native app" });
               fs.appendFileSync("/Users/tnarik/Desktop/nodeconfla/log-stdio-test.log", "\npushed\n");
               done();
               fs.appendFileSync("/Users/tnarik/Desktop/nodeconfla/log-stdio-test.log", "done\n");

               persistData(space, title, pageStorage);
            });
         } else {
            fs.appendFileSync("/Users/tnarik/Desktop/nodeconfla/log-stdio-test.log", "2nd fetch issue\n");
            throw (request);
         }
      })
      .catch(error => {
         fs.appendFileSync("/Users/tnarik/Desktop/nodeconfla/log-stdio-test.log", "fetch error\n");
         fs.appendFileSync("/Users/tnarik/Desktop/nodeconfla/log-stdio-test.log", error.status);
         console.error("a horrible error");
         console.error("Error fetching page");
         console.error(error.status);
         console.error(error);
         push({ response: "AN ERROR from the native app" });
         done();
      });
}

function processNative(msg, push, done) {
   fs.appendFileSync("/Users/tnarik/Desktop/nodeconfla/log-stdio-test.log", JSON.stringify(msg));
   fetchFromTitle(msg.space, msg.title, msg.host, push, done);
}

// Fails with "Text data outside of root node." Unless there is a root node (single wrapper node) added
// Requires a pretty explicity path, instead of catching all nodes (at least for the plantuml macro)

/*
function withXml2js() {
   const parser = new xml2js.Parser({ preserveChildrenOrder: true, explicitChildren: false });

   performance.mark("Meassure-Init");
   fs.readFile(path.join(__dirname, "a.xml"), "utf8", (err, data) => {
      //console.error(data);
      //var parseString = require('xml2js').parseString;
      //parseString(data, function (err, result) {
      for (let i = 0; i < 1; i++) {
         parser.parseString(data, (error, result) => {
            //console.error(result);
            //console.error(result.p[1]['ac:structured-macro']);
            //console.error(result.a['ac:structured-macro'])
            console.error(xpath.find(result, "//ac:rich-text-body/ac:structured-macro[@ac:name='plantuml']").length); // this works
            console.error(xpath.find(result, "//ac:structured-macro[@ac:name='plantuml']").length); // this doesn't works
            console.error(xpath.find(result, "//ac:structured-macro[@ac:name='jira']").length); // this doesn't works
         });
      }
      performance.mark("Meassure-Destroy");
      performance.measure("Meassure",
         "Meassure-Init",
         "Meassure-Destroy");
   });
}
*/

// Works, but there is no order
/*
function with_fxp() {
   const parser = require("fast-xml-parser");

   performance.mark("Meassure-Init");
   fs.readFile(path.join(__dirname, "a.xml"), "utf8", (err, data) => {
      //console.error(data);
      for (let i = 0; i < 1; i++) {
         if (parser.validate(data) === true) {
            console.error("it validates");
            var jsonObj = parser.parse(data);
            console.error(jsonObj["ac:structured-macro"]);
         } else {
            //console.error(parser.validate(data));
         }
      }

      performance.mark("Meassure-Destroy");
      performance.measure("Meassure",
         "Meassure-Init",
         "Meassure-Destroy");
   });
}
*/

// Works, but there is no order
/*
function withFonto() {
   //const DomParser = require("dom-parser");
   //const parser = new DomParser();

   performance.mark("Meassure-Init");
   fs.readFile(path.join(__dirname, "a.xml"), "utf8", (err, data) => {
      //console.error(data);
      for (let i = 0; i < 1; i++) {
         //var dom = parser.parseFromString(data);
         //var dom = sync(data); // If slimdom-sax-parser is used directly, namespaces require injection in the XML

         const options = {
            additionalNamespaces: {
               ac: "http://www.atlassian.com/schema/confluence/4/ac/",
               ri: "http://www.atlassian.com/schema/confluence/4/ri/"
            }
         };
         const dom = sync(data, options);


         //console.error(dom.getElementsByTagName('ac:structured-macro').length);
         //console.error(dom.getElementsByTagName('p').length);

        //console.error(evaluateXPathToNodes("//ac:structured-macro[@ac:name='plantuml']", dom, domFacade, null, {namespaceResolver: function (prefix)
        //  {
        //      return {
        //          "ac": "http://www.atlassian.com/schema/confluence/4/ac/",
        //          "ri": "http://www.atlassian.com/schema/confluence/4/ri/"
        //      }[prefix];
        //  }}).length);

         console.error(evaluateXPathToNodes("//ac:structured-macro[@ac:name='plantuml']", dom, domFacade, null,
            {
               namespaceResolver: prefix => options.additionalNamespaces[prefix]
            }).length);
         console.error(evaluateXPathToNodes("//ac:structured-macro[@ac:name='jira']", dom, domFacade, null,
            {
               namespaceResolver: prefix => options.additionalNamespaces[prefix]
            }).length);
      }

      performance.mark("Meassure-Destroy");
      performance.measure("Meassure",
         "Meassure-Init",
         "Meassure-Destroy");
   });
}
*/

// Works, but there is no order
/*
function with_wgxp() {
   const DomParser = require("dom-parser");
   const parser = new DomParser();
   //const wgxpath = require("wgxpath");

   performance.mark("Meassure-Init");
   fs.readFile(path.join(__dirname, "a.xml"), "utf8", (err, data) => {
      //console.error(data);
      for (let i = 0; i < 1; i++) {
         //console.error('it validates');
         const jsonObj = parser.parseFromString(data);
         console.error(jsonObj);
      }

      performance.mark("Meassure-Destroy");
      performance.measure("Meassure",
         "Meassure-Init",
         "Meassure-Destroy");
   });
}
*/

/*
const wrapped = performance.timerify(withFonto);

const set = new Set();
const hook = asyncHooks.createHook({
   init(id, type) {
      if (type === "Timeout") {
         performance.mark(`Timeout-${id}-Init`);
         set.add(id);
      }
   },
   destroy(id) {
      if (set.has(id)) {
         set.delete(id);
         performance.mark(`Timeout-${id}-Destroy`);
         performance.measure(`Timeout-${id}`,
            `Timeout-${id}-Init`,
            `Timeout-${id}-Destroy`);
      }
   }
});
//hook.enable();

//setTimeout(() => {wrapped()});
*/

const obs = new PerformanceObserver(list => {
   console.error(list.getEntries()[0]);
   performance.clearMarks();
   obs.disconnect();
});
obs.observe({ entryTypes: ["measure"], buffered: true });

//- A performance timeline entry will be created
// wrapped();

/*
process.argv.forEach((val, index) => {
   fs.appendFileSync('electron-stdio-test.log', `${val}\n`)
});
*/


if (require.main === module) {
   fs.appendFileSync("/Users/tnarik/Desktop/nodeconfla/log-stdio-test.log", "\nget.js used directly =>\n");
   fs.appendFileSync("/Users/tnarik/Desktop/nodeconfla/log-stdio-test.log", `${process.argv.join("\n")}`);
   if (process.argv.length > 2) {
      if (process.argv[2] === "chrome-extension://fehcjibefedmpdhalkdlpeeneojhcanc/") {
         fs.appendFileSync("/Users/tnarik/Desktop/nodeconfla/log-stdio-test.log", "this is the extension calling");

         process.stdin
            .pipe(new nativeMessage.Input())
            .pipe(new nativeMessage.Transform(processNative))
            .pipe(new nativeMessage.Output())
            .pipe(process.stdout);
      }
   }
} else {
   console.error("No main module");
   fs.appendFileSync("/Users/tnarik/Desktop/nodeconfla/log-stdio-test.log", `${process.argv.join("\n")}`);

   process.stdin
      .pipe(new nativeMessage.Input())
      .pipe(new nativeMessage.Transform(processNative))
      .pipe(new nativeMessage.Output())
      .pipe(process.stdout);
}

module.exports = fetchFromTitle;