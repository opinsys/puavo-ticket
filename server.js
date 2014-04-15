"use strict";

require("./db");
var browserify = require("browserify-middleware");
var express = require("express");

var serveStatic = require("serve-static");
var bodyParser = require("body-parser");

var app = express();

app.use(bodyParser());
app.use(serveStatic(__dirname));
app.use("/doc", serveStatic(__dirname + "/doc"));

if (process.env.NODE_ENV !== "production") {
    app.use(require("./test/server"));
}

app.get("/bundle.js", browserify("./client.js", {
    transform: ["reactify"]
}));



if (process.env.NODE_ENV !== "production") {
    app.use(require("./test/server"));
}

});


app.get("/bundle.js", browserify("./client.js", {
    transform: ["reactify"]
}));


app.use(require("./resources/tickets"));

app.get("/*", function(req, res) {
    res.sendfile(__dirname + "/views/index.html");
});

module.exports = app;

if (require.main === module) {
    var server = app.listen(3000, function() {
        console.log('Listening on port %d', server.address().port);
    });
}
