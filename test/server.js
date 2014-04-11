"use strict";
var fs = require("fs");

var express = require("express");
var browserify = require("browserify-middleware");
var app = express();

app.get("/test/components/bundle.js", browserify(__dirname + "/components/index.js", {
    transform: ["reactify"]
}));

app.get("/test", function(req, res) {
    res.sendfile(__dirname + "/index.html");
});

app.get("/sinon/sinon.js", function(req, res) {
    res.sendfile(__dirname + "/vendor/sinon.js");
});

// res.sendfile does not allow sending file from node_modules. Workaround with
// raw fs api.
app.get("/mocha/mocha.css", function(req, res) {
    res.set("Content-Type", "text/css");
    fs.createReadStream(__dirname + "/../node_modules/mocha/mocha.css").pipe(res);
});

app.get("/mocha/mocha.js", function(req, res) {
    res.set("Content-Type", "application/javascript");
    fs.createReadStream(__dirname + "/../node_modules/mocha/mocha.js").pipe(res);
});


module.exports = app;
