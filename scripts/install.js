#!/usr/bin/env node
const path = require('path')
const fs = require('fs')

nm_host = require(path.join(path.dirname(__dirname), "nm_host.json"))
package = require(path.join(path.dirname(__dirname), "package.json"))
var nm_mnf = {
  name: package.nativeMessaging.name,
  description: package.description,
  path: path.join(path.dirname(__dirname), package.main),
  type: "stdio",
  allowed_origins: package.nativeMessaging.extensions.map(item => `chrome-extension://${item}/`)
}

// Native Messaging manifest file destination
const nm_mnf_file = `${package.nativeMessaging.name}.json`
const nm_mnf_folder = path.join(require('os').homedir(), "Library", "Application Support", "Google", "Chrome", "NativeMessagingHosts")

console.log(JSON.stringify(nm_mnf, null, 3))
//fs.writeFile(path.join(nm_mnf_folder, nm_mnf_file), JSON.stringify(nm_mnf, null, 3), err => {
//   if (err) throw err;
//})

console.log("native messaging host added to Chrome")