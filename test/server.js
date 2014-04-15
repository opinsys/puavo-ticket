"use strict";
var path = require("path");
var projectDir = path.resolve(__dirname, "..");

var express = require("express");
var serveStatic = require("serve-static");
var spawn = require("child_process").spawn;
var browserify = require("browserify-middleware");
var app = express();

app.get("/test/components/bundle.js", browserify(projectDir + "/test/components/index.js", {
    transform: ["reactify"]
}));

app.get("/", function(req, res) {
    res.sendfile(projectDir + "/test/index.html");
});

app.use(serveStatic(projectDir));

module.exports = app;

if (require.main === module) {
    var server = app.listen(process.env.PORT || 1234, function() {
        var url = "http://localhost:" + server.address().port;
        console.log("Listening on ", url);

        if (process.env.DISPLAY) {
            console.log("Display detected. Opening browser");
            spawn("xdg-open", [url]);
        }

    });
}
