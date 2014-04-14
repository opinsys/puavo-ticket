"use strict";

require("./db");
var browserify = require("browserify-middleware");
var express = require("express");
var Ticket = require("./models/server/Ticket");
var Comment = require("./models/server/Comment");
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

app.get("/api/tickets", function(req, res, next) {
    console.log("GET", req.url);
    Ticket.collection().fetch()
    .then(function(coll) {
        res.json(coll.toJSON());
    })
    .catch(next);
});

app.get("/api/tickets/:id", function(req, res, next) {
    console.log("GET", req.url);
    Ticket.forge({ id: req.params.id }).fetch()
    .then(function(ticket) {
        if (!ticket) return res.json(404, { error: "no such ticket" });
        res.json(ticket.toJSON());
    })
    .catch(next);
});

app.post("/api/tickets", function(req, res, next) {
    Ticket.forge(req.body)
    .save()
    .then(function(ticket) {
        res.json(ticket.toJSON());
    })
    .catch(next);
});

app.put("/api/tickets/:id", function(req, res, next) {
    Ticket.forge({ id: req.params.id })
    .fetch()
    .then(function(ticket) {
        if (!ticket) return res.json(404, { error: "no such ticket" });
        ticket.set(req.body);
        return ticket.save();
    })
    .then(function(ticket) {
        res.json(ticket.toJSON());
    })
    .catch(next);
});

app.post("/api/tickets/:id/comments", function(req, res, next) {
    Ticket.forge({ id: req.params.id })
    .fetch()
    .then(function(ticket) {
        if (!ticket) return res.json(404, { error: "no such ticket" });
        Comment.forge({ comment: req.body.comment })
        .save()
        .then(function(comment) {
            res.json(comment.toJSON());
        });
    })
    .catch(next);
});

app.get("/api/tickets/:id/comments", function(req, res, next) {
    // TODO: limit with req.params.id!
    Comment.collection()
    .fetch()
    .then(function(collection) {
        res.json(collection.toJSON());
    })
    .catch(next);
});


app.get("/*", function(req, res) {
    res.sendfile(__dirname + "/views/index.html");
});

module.exports = app;

if (require.main === module) {
    var server = app.listen(3000, function() {
        console.log('Listening on port %d', server.address().port);
    });
}
