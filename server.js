"use strict";
// Register babel compiler before require any code XXX ES6 is not usable in this
// file. We should wrap it
require("./babel-register");
var PRODUCTION = process.env.NODE_ENV === "production";
var CACHE_KEY = Date.now();
var STARTED = Date.now();
var VERSION = "loading";
var HOSTNAME = require("os").hostname();
require("moment/locale/fi");

if (!PRODUCTION) {
    // Use environment variable to set the Bluebird long stack traces in order
    // to enable it from libraries too
    process.env.BLUEBIRD_DEBUG = "true";

    if (process.env.NODE_ENV !== "test" && !process.env.DEBUG) {
        // Enable all debug logs in development mode if nothing is enabled
        process.env.DEBUG = "app:*";
    }
}


var db = require("./db");
var winston = require("winston");
var Promise = require("bluebird");
var express = require("express");
var Server = require("http").Server;
var prettyMs = require("pretty-ms");
var exec = require("child_process").exec;
var crypto = require("crypto");
var React = require("react/addons");

var debug = require("debug")("app:live");
var debugMem = require("debug")("memory");
var debugKnexPool = require("debug")("knexpool");
var serveStatic = require("serve-static");
var bodyParser = require("body-parser");
var compression = require("compression");
var jwtsso = require("jwtsso");
var cookieParser = require("cookie-parser");
var csrf = require("csurf");
var session = require("express-session");
var RedisStore = require("connect-redis")(session);

var WinstonChild = require("./utils/WinstonChild");
var User = require("./models/server/User");
var Acl = require("./models/Acl");
var Ticket = require("./models/server/Ticket");

var WinstonFluentd = require("./utils/WinstonFluentd");
var config = require("./config");

winston.add(WinstonFluentd, {
    tag: "puavo-ticket",
    level: "debug",
    fluentd: config.fluentd
});



if (process.env.NODE_ENV !== "test") {
    // WTF somebody is already listening to this
    process.removeAllListeners("uncaughtException");
    process.on("uncaughtException", function(err) {

        console.error("Captured uncaughtException and exiting soon!", process.pid);
        console.error(err.message);
        console.error(err.stack);

        setTimeout(function() {
            console.log("Log timeout. Exiting!");
            process.exit(667);
        }, 2000);

        winston.error("uncaughtException", {error: {
            message: err.message,
            meta: err.meta || null,
            stack: err.stack
        }}, function(err) {
            console.log("Exiting!");
            process.removeAllListeners("uncaughtException");
            process.exit(666);
        });

    });
}

winston.info("process starting");

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

// Set env DEBUG=pool2,knexpool
debugKnexPool("Knex pool debugging active");
app.use(function(req, res, next) {
    debugKnexPool("Knex pool before " + req.url, db.knex.client.pool.stats());
    next();
});

app.use(compression());
app.use(require("./utils/middleware/createResponseLogger")());
var server = Server(app);
var sio = require("socket.io")(server);
app.sio = sio;

// Configure test resource before authentication so it can be accessed by
// monitors
app.use(require("./resources/test"));

var sessionMiddleware = session({
    name: "puavo-ticket-sid",
    resave: true,
    saveUninitialized: true,
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
        socket.logger = new WinstonChild(winston, {
            knexPoolStats: db.knex.client.pool.stats(),
            userId: user.get("id"),
            sio: true
        });
        socket.logger.info("socket.io auth ok");
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
        socket.logger.info("socket.io disconnect");
        debug(
            "%s disconnected from socket.io",
            socket.user
        );
    });

});

app.use(require("./utils/middleware/createSlowInternet")());
app.use(bodyParser());
app.use(cookieParser());
app.use(sessionMiddleware);

var csrfMiddleware = csrf();
app.use(function(req, res, next) {
    // /api/emails is a remote api. Allow calls without a csrf token
    if (/^\/api\/emails/.test(req.path)) return next();
    csrfMiddleware(req, res, next);
});



app.use(jwtsso({

    // Service endpoint that issues the jwt tokens
    authEndpoint: config.puavo.restServerAddress + "/v3/sso",

    // Shared secret string with the above service
    sharedSecret: config.puavo.sharedSecret,

    // Set max age in seconds for the tokens
    // Defaults to 60 seconds
    maxAge: 120,

    hook: function(token, done) {
        User.ensureUserFromJWTToken(token)
        .then(function(user) {
            winston.info("user authenticated", {userId: user.get("id")});
        })
        .then(done.bind(this, null))
        .catch(done);
    }

}));

app.use("/styles", serveStatic(__dirname + "/styles"));
app.use("/components", serveStatic(__dirname + "/components"));
app.use("/bootstrap", serveStatic(__dirname + "/node_modules/bootstrap"));
app.use("/font-awesome", serveStatic(__dirname + "/node_modules/font-awesome"));
app.use("/json-human", serveStatic(__dirname + "/node_modules/json-human"));
app.use(serveStatic(__dirname + "/public"));
app.use("/doc", serveStatic(__dirname + "/doc"));

// Make socket.io object available from the request object
app.use(function setSiotoReq(req, res, next) {
    req.sio = sio;
    next();
});
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
        if (/^\/api/.test(req.path)) {
            return res.status(403).json({
                error: "No credentials",
                code: "NOAUTH"
            });
        }

        return res.requestJwt();
    }

    User.byExternalId(req.session.jwt.id).fetch({
        withRelated: "accessTags"
    })
    .then(function(user) {
        if (!user) {
            // The database was probably destroyed during development and the
            // user in the session has disappeared. Just destroy the session
            // and redirect to front page.
            req.session.destroy();
            return res.redirect("/");
        }
        req.user = user;
        req.logger = new WinstonChild(req.logger, {
            userId: user.get("id"),
            req: true
        });
        next();
    })
    .catch(next);
});

app.use(require("./utils/middleware/blockUsersWithoutEmail"));

app.get("/logout", function(req, res) {
    req.session.destroy();
    res.redirect("/");
});


app.use("/api", require("./resources/json-human"));
app.use(require("./resources/tickets"));
app.use(require("./resources/comments"));
app.use(require("./resources/attachments"));
app.use(require("./resources/followers"));
app.use(require("./resources/handlers"));
app.use(require("./resources/tags"));
app.use(require("./resources/notifications"));
app.use(require("./resources/titles"));
app.use(require("./resources/views"));
app.use(require("./resources/users"));
app.use("/api/puavo", require("./resources/puavo_api_proxy")(config));


var loadingEl = React.createElement(require("./components/Loading"));
var loadingHTMLString = React.renderToString(loadingEl);

app.get("/*", function(req, res) {
    var csrfToken = req.csrfToken();

    var jsBundle = "/build/bundle.js";
    var cssBundle = "/build/styles.css";
    var cacheKey = CACHE_KEY;


    res.header("x-csrf-token", csrfToken);
    res.render("index.ejs", {
        spinner: loadingHTMLString,
        csrfToken: csrfToken,
        jsBundle: jsBundle,
        cssBundle: cssBundle,
        cacheKey: cacheKey,
        user: req.user.toJSON(),
        serverHostname: HOSTNAME,
        uptime: prettyMs(Date.now() - STARTED),
        ptVersion: VERSION
    });
});

app.use("/api", function(err, req, res, next) {
    if (err.message === "EmptyResponse") {
        return res.status(404).json({
            error: "ticket not found",
            message: err.message
        });
    }

    if (err instanceof Acl.PermissionDeniedError) {
        req.logger.error("acl permission error", {
            error: {
                message: err.message
            }
        });
        return res.status(403).json({
            error: "permission denied",
            message: err.message
        });
    }

    next(err);
});

app.use(function(err, req, res, next) {
    if (err instanceof User.EmailCollisionError) {
        req.logger.error("email collision", err.meta);
        return res.status("406").render("emailCollisionError.ejs");
    }

    if (err.code === "EBADCSRFTOKEN") {
        req.logger.error("invalid csrf token");
        return res.status(403).json({ error: "invalid csrf token" });
    }

    req.logger.error("unhandled error", {
        error: {
            message: err.message,
            meta: err.meta || null,
            stack: err.stack
        }
    });

    if (process.env.NODE_ENV !== "test") return next(err);
    res.status(500).send(err.message + "\n" + err.stack);
});

module.exports = app;

if (require.main === module) {
    server.listen(config.port, function() {
        console.log("Javascript API docs http://opinsys.github.io/puavo-ticket/");
        console.log("REST API docs http://opinsys.github.io/puavo-ticket/rest");

        var addr = server.address();
        console.log('Listening on  http://%s:%d', addr.address, addr.port);
        winston.info("process listening");
    });

    if (!PRODUCTION && !process.env.START_TEST_SERVER) {
        require("./devmode")(sio);
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

    exec("dpkg -s puavo-ticket", function(err, stdout) {
        if (err) {
            return console.error("Failed to read puavo-ticket deb package version");
        }
        var re = /^Version: *(.+)/;

        VERSION = stdout.split("\n").filter(function(line) {
            return re.test(line);
        }).map(function(line) {
            return re.exec(line)[1];
        })[0];

        if (!PRODUCTION) return;

        var shasum = crypto.createHash("sha1");
        CACHE_KEY = shasum.update(VERSION).digest("hex");
    });

}
