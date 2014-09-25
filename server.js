"use strict";

if (process.env.NODE_ENV !== "production") {
    process.env.BLUEBIRD_DEBUG = "true";
}

require("./db");
var Promise = require("bluebird");
var express = require("express");
var Server = require("http").Server;

var debug = require("debug")("app:live");
var debugMem = require("debug")("app:memory");
var serveStatic = require("serve-static");
var bodyParser = require("body-parser");
var jwtsso = require("jwtsso");
var cookieParser = require("cookie-parser");
var session = require("express-session");
var RedisStore = require("connect-redis")(session);

var User = require("./models/server/User");
var Ticket = require("./models/server/Ticket");

var config = require("./config");
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
var server = Server(app);
var sio = require("socket.io")(server);
app.sio = sio;

var sessionMiddleware = session({
    store: new RedisStore(config.redis),
    secret: config.sessionSecret
});

sio.use(function(socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
});

sio.use(function(socket, next) {
    var req = socket.request;
    Promise.resolve().then(function() {
        return User.byExternalId(req.session.jwt.id).fetch({ require: true });
    })
    .then(function(user) {
        socket.user = user;
        debug("%s authenticated with socket.io", user);
    })
    .then(next.bind(this, null))
    .catch(function(err) {
        console.error("Socket.IO socket init failed", err);
        next(err);
    });
});

sio.sockets.on("connection", function(socket) {
    socket.join(socket.user.getSocketIORoom());

    socket.on("startWatching", function(ob) {
        Ticket.fetchByIdConstrained(socket.user, ob.ticketId)
        .then(function(ticket) {
            socket.join(ticket.getSocketIORoom());

            debug(
                "%s started watching ticket %s",
                socket.user, ticket.get("id")
            );
        })
        .catch(console.error);
    });

    socket.on("stopWatching", function(ob) {
        socket.leave("ticket:" + ob.ticketId);
        debug(
            "%s stopped watching ticket %s",
            socket.user, ob.ticketId
        );
    });

    socket.on("disconnect", function() {
        debug(
            "%s disconnected from socket.io",
            socket.user
        );
    });

});

app.use(sessionMiddleware);

app.use(require("./utils/middleware/createSlowInternet")());
app.use(require("./utils/middleware/createResponseLogger")());
app.use(bodyParser());
app.use(cookieParser());

app.use(sessionMiddleware);

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


app.use("/styles", serveStatic(__dirname + "/styles"));
app.use("/bootstrap", serveStatic(__dirname + "/node_modules/bootstrap"));
app.use("/flat-ui", serveStatic(__dirname + "/node_modules/flat-ui"));
app.use(serveStatic(__dirname + "/public"));
app.use("/doc", serveStatic(__dirname + "/doc"));

// Must be set here before the `ensureAuthentication` middleware because it
// must be accessed without Puavo credentials
app.use(require("./resources/emails"));


/**
 * Set an instance of models.User to the request object when user has been
 * authenticated
 *
 * @for server.Request
 * @property {models.User} user
 */
app.use(function ensureAuthentication(req, res, next) {
    if (!req.session.jwt) {
        console.log("Not auth!");
        return res.requestJwt();
    }

    User.byExternalId(req.session.jwt.id).fetch()
    .then(function(user) {
        if (!user) {
            // The database was probably destroyed during development and the
            // user in the session has disappeared. Just destroy the session
            // and redirect to front page.
            req.session.destroy();
            return res.redirect("/");
        }
        req.sio = sio;
        req.user = user;
        next();
    })
    .catch(next);
});


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
    server.listen(config.port, function() {
        console.log("Javascript API docs http://opinsys.github.io/puavo-ticket/");
        console.log("REST API docs http://opinsys.github.io/puavo-ticket/rest");

        var addr = server.address();
        console.log('Listening on  http://%s:%d', addr.address, addr.port);
    });

    // Reload browser when the client side code changes
    require("./devmode").on("update", function() {
        sio.sockets.emit("reload");
    });
}


if (debugMem.name === "enabled") {
    var filesize = require("filesize");
    var last = process.memoryUsage().rss;
    setInterval(function() {
        var current = process.memoryUsage().rss;
        var change = current - last;
        last = current;

        if (Math.abs(change) < 1024) return;
        debugMem(
            "Memory usage %s change from last %s",
            filesize(current), filesize(change)
        );
    }, 500);
}
