"use strict";

if (process.env.NODE_ENV !== "production") {
    process.env.BLUEBIRD_DEBUG = "true";
}

require("./db");
var browserify = require("browserify-middleware");
var express = require("express");

var serveStatic = require("serve-static");
var bodyParser = require("body-parser");
var jwtsso = require("jwtsso");
var cookieParser = require("cookie-parser");
var session = require("express-session");
var RedisStore = require("connect-redis")(session);

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

app.use(require("./utils/middleware/createSlowInternet")());
app.use(require("./utils/middleware/createResponseLogger")());
app.use(bodyParser());
app.use(require("./utils/middleware/createMultipartMiddleware")());
app.use(cookieParser());


app.use(session({
    store: new RedisStore(config.redis),
    secret: "keyboard cat", // XXX
}));

app.use(jwtsso({

    // Service endpoint that issues the jwt tokens
    authEndpoint: config.puavo.restServerAddress + "/v3/sso",

    // Shared secret string with the above service
    sharedSecret: config.puavo.sharedSecret,

    // Public mountpoint for this app
    mountPoint: config.publicURL,

    // Set max age in seconds for the tokens
    // Defaults to 60 seconds
    maxAge: 120,

    hook: function(token, done) {
        User.ensureUserFromJWTToken(token)
        .then(done.bind(this, null))
        .catch(done);
    }

}));


app.use(require("./utils/middleware/createSassMiddleware")({
    url: "/styles/index.css",
    file: __dirname + "/styles/index.scss"
}));
app.use("/styles", serveStatic(__dirname + "/styles"));
app.use("/bootstrap", serveStatic(__dirname + "/node_modules/bootstrap"));
app.use("/flat-ui", serveStatic(__dirname + "/node_modules/flat-ui"));
app.use(serveStatic(__dirname + "/public"));
app.use("/doc", serveStatic(__dirname + "/doc"));


/**
 * Set an instance of models.User to the request object when user has been
 * authenticated
 *
 * @for server.Request
 * @property {models.User} user
 */
app.use(function(req, res, next) {
    if (!req.session.jwt) {
        console.log("Not auth!");
        return res.requestJwt();
    }

    User.byExternalId(req.session.jwt.id).fetch()
    .then(function(user) {
        if (!user) {
            throw new Error("Unknown external_id: " + req.session.jwt.id);
        }
        req.user = user;
    })
    .then(next.bind(this, null))
    .catch(next);
});


app.get("/bundle.js", browserify("./client.js"));


app.get("/logout", function(req, res) {
    req.session.destroy();
    res.redirect("/");
});

app.use(require("./resources/tickets"));
app.use(require("./resources/related_users"));
app.use(require("./resources/comments"));
app.use(require("./resources/devices"));
app.use(require("./resources/attachments"));
app.use(require("./resources/followers"));
app.use(require("./resources/visibilities"));
app.use(require("./resources/handlers"));
app.use(require("./resources/tags"));
app.use(require("./resources/notifications"));
app.use(require("./resources/titles"));

app.use("/api/puavo", require("./resources/puavo_api_proxy")(config));


app.get("/*", function(req, res) {
    res.render("index.ejs", {
        user: req.user.toJSON()
    });
});

app.use(function(err, req, res, next) {
    if (process.env.NODE_ENV !== "test") next(err);
    res.status(500).send(err.stack);
});

module.exports = app;

if (require.main === module) {
    var server = app.listen(config.port, function() {
        console.log("Javascript API docs http://opinsys.github.io/puavo-ticket/");
        console.log("REST API docs http://opinsys.github.io/puavo-ticket/rest");

        var addr = server.address();
        console.log('Listening on  http://%s:%d', addr.address, addr.port);
    });
}
