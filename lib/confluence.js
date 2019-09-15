#!/Users/tnarik/.nvm/versions/node/v10.15.0/bin/node

//#!/usr/bin/env node

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


const SITE_STATUS_KNOWN = 1
const SITE_STATUS_PARTIAL = 2
const SITE_STATUS_COMPLETE = 3

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

let config;
const loadConfiguration = conf => {
   log(conf)
   if (conf === undefined) {
     return new Conf();
   }
   if (Conf.prototype.isPrototypeOf(conf)) {
     return conf
   }
   if (typeof conf === 'string') {
      return new Conf({configName: `config${conf}`})
   }
   return new Conf(conf);
}

//config.clear()
//console.log(config);

//if (!config.has("nm_installed")) {
//   console.log("Should install the nm manifest");
//   console.log(config.set("nm_installed", true));
//} else {
//   console.log(config.store)
//}

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

const createFilePlus = (dir, file, content) => {
   if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
   }
   const filePath = path.join(dir, file)
   fs.writeFileSync(filePath, content);
   return filePath;
};

function fetchById(id, host = process.env.CHOST, push = () => {}, done = () => {}) {
   let url = `${host}/rest/api/content/${id}`
   console.log(url)
   return makeRequest(`${url}?expand=body.storage`, credentials)
      .then(request => {
         console.error(`Received: ${request.status}`);
         log("\nresponse received 2\n");
         if (request.status === 200) {
            const responseJSON = JSON.parse(request.responseText);
            const pageStorage = `<root>${responseJSON.body.storage.value}</root>`;
            return pageStorage
         } else {
            log("2nd fetch issue\n");
            throw (request);
         }
      })
      .then( pageStorage=>{
         let filePath = createFilePlus("/tmp/kk", "rawContentPageId", pageStorage)
         return ([filePath, pageStorage])
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


function fetchPage(space, _title, host = process.env.CHOST, push = () => {}, done = () => {}) {
   log(`${space} and ${_title}\n`);

   const title = urlencode(_title).replace(/%2[B0]/g, "+");
   console.error(title);
   log(`${title}\n`);

   log(`${host}/rest/api/content?spaceKey=${space}&title=${title}\n`);
   log(JSON.stringify(credentials));
   return makeRequest(`${host}/rest/api/content?spaceKey=${space}&title=${title}`, credentials)
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
            return pageStorage
         } else {
            log("2nd fetch issue\n");
            throw (request);
         }
      })
      .then( pageStorage=>{
         let path = createFile(space, title, pageStorage);
         return ([path, pageStorage])
      /*
         xml2js.parseString(pageStorage, { explicitRoot: false }, (err, result) => {
               //console.error(result);
               // console.error(result["ac:structured-macro"][0]["ac:rich-text-body"])
               log(result);
               push({ response: "that response from the native app" });
               log("\npushed\n");
               done();
               log("done\n");

               //createFile(space, title, pageStorage);
            });
         */
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
            }).length+" macros");
         console.error(evaluateXPathToNodes("//ac:rich-text-body/ac:structured-macro[@ac:name='plantuml']", dom, domFacade, null,
            {
               namespaceResolver: prefix => options.additionalNamespaces[prefix]
            }).length+" PlantUMLs");
         console.error(evaluateXPathToNodes("//ac:structured-macro[@ac:name='plantuml']", dom, domFacade, null,
            {
               namespaceResolver: prefix => options.additionalNamespaces[prefix]
            }).length+" PlantUMLs");
         console.error(evaluateXPathToNodes("//ac:structured-macro[@ac:name='jira']", dom, domFacade, null,
            {
               namespaceResolver: prefix => options.additionalNamespaces[prefix]
            }).length+" JIRAs");

         // Extract:
         evaluateXPathToNodes("//ac:rich-text-body/ac:structured-macro[@ac:name='plantuml']/ac:plain-text-body", dom, domFacade, null,
            {
               namespaceResolver: prefix => options.additionalNamespaces[prefix]
            }).forEach((n, index) => {
               //console.log(`______ ${n.id}`)
               //console.log(n.firstChild.F)
               createFilePlus (`${filePath}_uml`, `diag_${index}.puml`, n.firstChild.F);
            })
      }
   });
}

const addSite = (url, username = "testusername", password = "testpassword") => {
   sites = config.get("sites", []);

   if (typeof(url) === "object" ) {
      let new_sites = sites.map(s => s.url == url.url? url:s)
      if ( !new_sites.includes(url) ) {
         new_sites.push(url)
      }
      config.set("sites", new_sites)
      return {}
   }


   existing_site = sites.filter(s => s.url === url)
   if ( existing_site.length === 0 ) {
      sites.push({ url: url,
            username: username,
            password: password,
            localPath: "/something/somethingNew" })
      config.set("sites", sites);
   } else {
      log("u "+username)
      log("p "+password)
   }
   return {}
}

const listSites = () => {
   return config.get("sites", []);
}

const listSitesSummary = () => {
   sites = config.get("sites", []);
   return sites.map(site => {
      status = SITE_STATUS_KNOWN
      if ( site.localPath.length > 0 ) {
         status  = SITE_STATUS_COMPLETE
      }

      return {
         url: site.url,
         status: status
      }
   })
}

const getSiteURLs = () => {
   log(`\ngetting sites from ${config}\n`)
   sites = config.get("sites", []);
   return sites.map(site => site.url )
}

/*
process.argv.forEach((val, index) => {
   fs.appendFileSync('electron-stdio-test.log', `${val}\n`)
});
*/

const pushPages = pages => {
   config.set("pages", pages);
   return {}
}

function processNative(msg, push, done) {
   log(JSON.stringify(msg));
   if (msg.cmd !== undefined) {
      log(`processing command '${msg.cmd}'`)
      if (msg.cmd === "getListURLs") { //NO USE
         push(getSiteURLs())
      }
      if (msg.cmd === "getList") { //NO USE
         push(listSites())
      }
      if (msg.cmd === "getListSummary") {
         config = loadConfiguration(msg.user_id)
         push(listSitesSummary())
      }
      if (msg.cmd === "pushPages") {
         config = loadConfiguration(msg.user_id)
         push(pushPages(msg.pages))
      }
      if (msg.cmd === "addSite") {
         config = loadConfiguration(msg.user_id)
         log(`worp! '${msg.cmd}'`)
         push(addSite(msg.site))
      }
      done()
   } else {
      fetchPage(msg.space, msg.title, msg.host, push, done);
   }
}

if (require.main === module) {
   log("\nget.js used directly =>\n");
   log(`${process.argv.join("\n")}`);
   if (process.argv.length > 2) {
      config = loadConfiguration()
      if (process.argv[2] === "chrome-extension://fehcjibefedmpdhalkdlpeeneojhcanc/") {
         log("\nthis is the extension calling\n");

         process.stdin
            .pipe(new nativeMessage.Input())
            .pipe(new nativeMessage.Transform(processNative))
            .pipe(new nativeMessage.Output())
            .pipe(process.stdout);
      }  else {
         var page_number = process.argv[2]
         var site = 'https://dummy'

         config = loadConfiguration("something")
         console.log(`${config.get("sites", []).length} - sites`)
         console.log(`${Object.keys(config.get("pages", {})).length} - sites with pages`)
         var page1 = config.get("pages", {})[site]
         console.log(`${page1.length} - pages for site ${site}`)

         console.log(page1[page_number])
         url = new URL(page1[page_number])
         if (/\/display\//.test(url.pathname) ) {
            // Page Title Format
            parts = url.pathname.split('/')
            title = parts[parts.length - 1]
            spaceKey = parts[parts.length - 2]

            fetchPage(spaceKey, title)
            .then(([filePath,pageStorage]) => {
               console.log(filePath)
               withFonto(filePath)
            })
         } else if (url.searchParams.has("pageId")) {
            // Page ID Format
            console.log(url.searchParams.get('pageId'))
            fetchById(url.searchParams.get('pageId'))
            .then(([filePath,pageStorage]) => {
                        console.log(filePath)
                        withFonto(filePath)
            })
         }
      }
   }
} else {
   //console.error("No main module");
   log(`${process.argv.join("\n")}`);
   /*
   process.stdin
      .pipe(new nativeMessage.Input())
      .pipe(new nativeMessage.Transform(processNative))
      .pipe(new nativeMessage.Output())
      .pipe(process.stdout);
   */
}

module.exports = conf => {
   config = loadConfiguration(conf);

   return {
      fetchPage,
      createFile,
      withFonto,
      addSite,
      listSites,
      getSiteURLs
   }
}