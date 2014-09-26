"use strict";
var fs = require("fs");
var promisify = require("repl-promised").promisify;

var models = fs.readdirSync(__dirname + "/../models/server/").filter(function(f) {
    return /\.js$/.test(f);
}).map(function(f) {
    return f.slice(0, -3); // remove extension
});

console.log();
console.log("All Bookshelf.js models should be now in scope");
console.log();
console.log("Try something like:");
console.log();
console.log("   Comment.fetchAll()");
console.log("   _.map(function(c) { return c.get(\"comment\") })");
console.log();
console.log("The '_' is the value of last returned promise");
console.log();

var repl = require("repl").start({});
repl.context.db = require("../db");
repl.context.Puavo = require("app/utils/Puavo");
models.forEach(function(modelName) {
    repl.context[modelName] = require("../models/server/" + modelName);
});

promisify(repl);
