#!/Users/tnarik/.nvm/versions/node/v8.9.0/bin/node
///usr/bin/env node

var nativeMessage = require('chrome-native-messaging');

process.stdin
    .pipe(new nativeMessage.Input())
    .pipe(new nativeMessage.Transform(function(msg, push, done) {
      push({response: "that response from the native app"});
      done();
    }))
    .pipe(new nativeMessage.Output())
    .pipe(process.stdout)

username = process.env.CUSER
password = process.env.CPASS
space = process.env.CSPACE
host = process.env.CHOST

const {
  performance,
  PerformanceObserver
} = require('perf_hooks');
const async_hooks = require('async_hooks');

const times = x => f => {
  if (x > 0) {
    f()
    times (x - 1) (f)
  }
}


var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

function reqListener () {
  console.log("response received");
  if (this.status == 200) {
    //console.log(this.responseText);
    responseJSON = JSON.parse(this.responseText);
    console.log(this.responseText);
    console.log(responseJSON.results[0].id);
    //console.log(responseJSON.results[0]._links);
    console.log(responseJSON.results[0]._links.self);
    fromId(responseJSON.results[0].id, responseJSON.results[0]._links.self);
  } else {
    console.log("Error fetching page");
    console.log(this.status);
    console.log(this);
  }
}

function areqListener () {
  console.log("response received");
  if (this.status == 200) {
    //console.log(this.responseText);
    responseJSON = JSON.parse(this.responseText);

    const page_storage = `<root>${responseJSON.body.storage.value}</root>`;
    


    //console.log(responseJSON.body.storage.value);

    /* // Cannot cope correctly with Namespaces
    var DomParser = require('dom-parser');
    var parser = new DomParser();
    var dom = parser.parseFromString(page_storage);
    console.log(dom.getElementsByTagName('ac:structured-macro'));
    console.log(dom.getElementsByTagName('ac:structured-macro').length);
    */

     // XML2JS
    var parseString = require('xml2js').parseString;
//    parseString('<p><ac:structured-macro ac:name="version-history" ac:schema-version="1" ac:macro-id="ddc718d7-58cf-468d-9df0-e8a6de3dc685"><ac:parameter ac:name="first">3</ac:parameter></ac:structured-macro></p><p><ac:structured-macro ac:name="toc" ac:schema-version="1" ac:macro-id="a0412837-acb4-4bb1-923e-95e868574f8f" /></p>', function (err, result) {
    parseString(page_storage, {explicitRoot: false}, function (err, result) {
      console.log(result);
      console.log(result['ac:structured-macro'][0]['ac:rich-text-body'])
    });
    
  


//   //console.log(responseJSON.results[0]._links);
//   console.log(responseJSON.results[0]._links.self);
//   fromId(responseJSON.results[0].id, responseJSON.results[0]._links);
  } else {
    console.log("Error fetching page");
    console.log(this.status);
    console.log(this);
  }
}

function fromTitle (title) {
  var oReq = new XMLHttpRequest();
  oReq.onload = reqListener;
  oReq.open("GET", "https://"+host+"/tempcps/rest/api/content?spaceKey="+space+"&title="+title, true, username, password);
  oReq.setRequestHeader('Content-Type', 'application/json');
  oReq.send();
}

function fromId (id, url) {
  console.log("and 2, towards "+url);
  var oReq = new XMLHttpRequest();
  oReq.onload = areqListener;
  oReq.open("GET", url+"?expand=body.storage", true, username, password);
  oReq.setRequestHeader('Content-Type', 'application/json');
  oReq.send();
  console.log("done sending");
}

// Fails with 'Text data outside of root node.' Unless there is a root node (single wrapper node) added
// Requires a pretty explicity path, instead of catching all nodes (at least for the plantuml macro)
var fs = require('fs');

function with_xml2js () {
  var xml2js = require('xml2js');
  var xpath = require("xml2js-xpath"); // But this is no real XPATH (doesn't find ALL elements when using //, for instance)

  var parser = new xml2js.Parser({'preserveChildrenOrder': true, 'explicitChildren': false}); 

  performance.mark(`Meassure-Init`);
  fs.readFile(__dirname + '/a.xml', "utf8", function(err, data) {
      //console.log(data);
      //var parseString = require('xml2js').parseString;
  //    parseString('<p><ac:structured-macro ac:name="version-history" ac:schema-version="1" ac:macro-id="ddc718d7-58cf-468d-9df0-e8a6de3dc685"><ac:parameter ac:name="first">3</ac:parameter></ac:structured-macro></p><p><ac:structured-macro ac:name="toc" ac:schema-version="1" ac:macro-id="a0412837-acb4-4bb1-923e-95e868574f8f" /></p>', function (err, result) {
        //parseString(data, function (err, result) {
      for (let i = 0; i < 1; i++) {

        parser.parseString(data, function (err, result) {
        
        //console.log(result);
        //console.log(result.p[1]['ac:structured-macro']);
        //console.log(result.a['ac:structured-macro'])
        console.log(xpath.find(result, "//ac:rich-text-body/ac:structured-macro[@ac:name='plantuml']").length); // this works
        console.log(xpath.find(result, "//ac:structured-macro[@ac:name='plantuml']").length); // this doesn't works
        console.log(xpath.find(result, "//ac:structured-macro[@ac:name='jira']").length); // this doesn't works

      });
    }
        performance.mark(`Meassure-Destroy`);
    performance.measure(`Meassure`,
                          `Meassure-Init`,
                          `Meassure-Destroy`);
  });
}

// Works, but there is no order
function with_fxp () {
  var parser = require('fast-xml-parser');
  var fs = require('fs');

  performance.mark(`Meassure-Init`);
  fs.readFile(__dirname + '/a.xml', "utf8", function(err, data) {
    //console.log(data);
    for (let i = 0; i < 1; i++) {
      if ( parser.validate(data) === true) {
        console.log('it validates');
        var jsonObj = parser.parse(data);
        console.log(jsonObj['ac:structured-macro']);
      } else {
        //console.log(parser.validate(data));
      }
    }


    performance.mark(`Meassure-Destroy`);
    performance.measure(`Meassure`,
                          `Meassure-Init`,
                          `Meassure-Destroy`);
  });

}

// Works, but there is no order
function with_fonto () {
  var DomParser = require('dom-parser');
  var parser = new DomParser();
  const {
    sync,
    slimdom,
    createHandler
  } = require('slimdom-sax-parser');
  const {
    evaluateXPath,
    evaluateXPathToBoolean,
    evaluateXPathToString,
    evaluateXPathToNodes,
    domFacade
  } = require('fontoxpath');

  
  var fs = require('fs');
  performance.mark(`Meassure-Init`);
  fs.readFile(__dirname + '/a.xml', "utf8", function(err, data) {
    //console.log(data);
    for (let i = 0; i < 1; i++) {
      //var dom = parser.parseFromString(data);

      //var dom = sync(data); // If slimdom-sax-parser is used directly, namespaces require injection in the XML

      const options = {
        additionalNamespaces: {
          "ac": "http://www.atlassian.com/schema/confluence/4/ac/",
          "ri": "http://www.atlassian.com/schema/confluence/4/ri/"
        }
      };
      var dom = sync(data, options);


      //console.log(dom.getElementsByTagName('ac:structured-macro').length);
      //console.log(dom.getElementsByTagName('p').length);
      /*
      console.log(evaluateXPathToNodes("//ac:structured-macro[@ac:name='plantuml']", dom, domFacade, null, {namespaceResolver: function (prefix)
        {
            return {
                "ac": "http://www.atlassian.com/schema/confluence/4/ac/",
                "ri": "http://www.atlassian.com/schema/confluence/4/ri/"
            }[prefix];
        }}).length);
        */
      console.log(evaluateXPathToNodes("//ac:structured-macro[@ac:name='plantuml']", dom, domFacade, null, {namespaceResolver: function (prefix)
        {
            return options.additionalNamespaces[prefix];
        }}).length);
      console.log(evaluateXPathToNodes("//ac:structured-macro[@ac:name='jira']", dom, domFacade, null, {namespaceResolver: function (prefix)
        {
            return options.additionalNamespaces[prefix];
        }}).length);
    }


    performance.mark(`Meassure-Destroy`);
    performance.measure(`Meassure`,
                          `Meassure-Init`,
                          `Meassure-Destroy`);
  });

}


// Works, but there is no order
function with_wgxp () {
  var DomParser = require('dom-parser');
  var parser = new DomParser();
  var wgxpath = require('wgxpath');
  var fs = require('fs');

  performance.mark(`Meassure-Init`);
  fs.readFile(__dirname + '/a.xml', "utf8", function(err, data) {
    //console.log(data);
    for (let i = 0; i < 1; i++) {
     
        //console.log('it validates');
        var jsonObj = parser.parseFromString(data);

        console.log(jsonObj);

    }


    performance.mark(`Meassure-Destroy`);
    performance.measure(`Meassure`,
                          `Meassure-Init`,
                          `Meassure-Destroy`);
  });

}







const wrapped = performance.timerify(with_fonto);


const set = new Set();
const hook = async_hooks.createHook({
  init(id, type) {
    if (type === 'Timeout') {
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

const obs = new PerformanceObserver((list) => {
  console.log(list.getEntries()[0]);
  performance.clearMarks();
  obs.disconnect();
});
obs.observe({ entryTypes: ['measure'], buffered: true });

// A performance timeline entry will be created
//wrapped();


fromTitle('Trackimo+Account+Adapter');
