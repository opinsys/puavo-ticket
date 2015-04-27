"use strict";


var express = require("express");
var http = require("http");


var app = express();


app.use(
    "/fonts/bootstrap/",
    express.static(__dirname + "/node_modules/bootstrap-sass/assets/fonts/bootstrap")
);

app.use("/", express.static(__dirname));

http.createServer(app).listen(8080, function() {
    console.log("Listening");
});

