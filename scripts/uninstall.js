#!/usr/bin/env node
const path = require('path')
const fs = require('fs')

nm_host = require(path.join(path.dirname(__dirname), "nm_host.json"))

// Native Messaging manifest file destination
const nm_mnf_file = `${nm_host.name}.json`
const nm_mnf_folder = path.join(require('os').homedir(), "Library", "Application Support", "Google", "Chrome", "NativeMessagingHosts")

fs.unlink(path.join(nm_mnf_folder, nm_mnf_file), err => {
   if (err) throw err;
})

console.log("native messaging host removed from Chrome")