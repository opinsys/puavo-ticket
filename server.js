"use strict";

require("./db");
var browserify = require("browserify-middleware");
var express = require("express");

var serveStatic = require("serve-static");
var bodyParser = require("body-parser");
var jwtsso = require("jwtsso");
var cookieParser = require("cookie-parser");
var session = require("express-session");


var app = express();

var config = require("./config");

app.use(bodyParser());
app.use(cookieParser());
app.use(session({
    secret: "keyboard cat",
}));

app.use(jwtsso({

    // Service endpoint that issues the jwt tokens
    authEndpoint: "https://api.opinsys.fi/v3/sso",

    // Shared secret string with the above service
    sharedSecret: config.puavoSharedSercret,

    // Public mountpoint for this app
    mountPoint: "http://puavo-ticket-dev:3000",

    // Set max age in seconds for the tokens
    // Defaults to 60 seconds
    maxAge: 120

}));


app.use(serveStatic(__dirname + "/public"));
app.use("/doc", serveStatic(__dirname + "/doc"));

if (process.env.NODE_ENV !== "production") {
    app.use(require("./test/server"));
}

app.use(function(req, res, next) {
    if (!req.session.jwt) {
        console.log("Not auth!");
        return res.requestJwt();
    }
    next();
});


app.get("/bundle.js", browserify("./client.js", {
    transform: ["reactify"]
}));


app.use(require("./resources/tickets"));

app.get("/*", function(req, res) {
    res.render("index.ejs", {
        user: req.session.jwt
    });
});

module.exports = app;

if (require.main === module) {
    var server = app.listen(3000, function() {
        console.log('Listening on port %d', server.address().port);
    });
}
