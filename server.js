"use strict";

require("./db");
var browserify = require("browserify-middleware");
var express = require("express");

var serveStatic = require("serve-static");
var bodyParser = require("body-parser");
var jwtsso = require("jwtsso");
var cookieParser = require("cookie-parser");
var session = require("express-session");

var User = require("./models/server/User");

/**
 * http://expressjs.com/4x/api.html#req.params
 *
 * @namespace server
 * @class Request
 */

/**
 * http://expressjs.com/4x/api.html#res.status
 *
 * @namespace server
 * @class Response
 */
var app = express();

var config = require("./config");

app.use(bodyParser());
app.use(cookieParser());
app.use(session({
    secret: "keyboard cat",
}));

var createOrUpdateUser = function(token, done) {
    User.collection()
        .query('where', 'user_id', '=', token.id)
        .fetchOne()
        .then(function(user) {
            if (!user) {
                return User.forge({
                    user_id: token.id,
                    username: token.username,
                    first_name: token.first_name,
                    last_name: token.last_name,
                    email: token.email,
                    organisation_domain: token.organisation_domain
                    }).save();
            }
            else {
                // FIXME: Update user data
            }
        })
        .then(function(user) {
            done();
        });
};

app.use(jwtsso({

    // Service endpoint that issues the jwt tokens
    authEndpoint: "https://api.opinsys.fi/v3/sso",

    // Shared secret string with the above service
    sharedSecret: config.puavoSharedSecret,

    // Public mountpoint for this app
    mountPoint: "http://puavo-ticket-dev:3000",

    // Set max age in seconds for the tokens
    // Defaults to 60 seconds
    maxAge: 120,

    hook: createOrUpdateUser

}));


app.use(serveStatic(__dirname + "/public"));
app.use("/doc", serveStatic(__dirname + "/doc"));



/**
 * An instance of  models.User when user has an authenticated session
 *
 * @for server.Request
 * @property {models.User} user
 */
app.use(function(req, res, next) {
    if (!req.session.jwt) {
        console.log("Not auth!");
        return res.requestJwt();
    }

    User.collection()
        .query('where', 'user_id', '=', req.session.jwt.id)
        .fetchOne()
        .then(function(user) {
            if (!user) return next();

            req.user = user;
        })
        .then(function() {
            next();
        })
        .catch(next);
});


app.get("/bundle.js", browserify("./client.js", {
    transform: ["reactify"]
}));


app.post("/logout", function(req, res) {
    req.session = null;
    res.redirect("/");
});

app.use(require("./resources/tickets"));
app.use(require("./resources/related_users"));
app.use("/api/puavo", require("./resources/puavo_api_proxy")(config));


app.get("/*", function(req, res) {
    res.render("index.ejs", {
        user: req.session.jwt
    });
});

module.exports = app;

if (require.main === module) {
    var server = app.listen(3000, function() {
        console.log("Javascript API docs http://opinsys.github.io/puavo-ticket/");
        console.log("REST API docs http://opinsys.github.io/puavo-ticket/rest");

        var addr = server.address();
        console.log('Listening on  http://%s:%d', addr.address, addr.port);
    });
}
