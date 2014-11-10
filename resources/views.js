"use strict";

var express = require("express");
var app = express.Router();

var View = require("app/models/server/View");


app.post("/api/views", function(req, res, next) {
    View.forge({
        createdById: req.user.get("id"),
        name: req.body.name,
        query: req.body.query
    })
    .save()
    .then(function(view) {
        res.json(view);
    })
    .catch(next);
});


app.get("/api/views", function(req, res, next) {

    View.collection()
    .query(function(q) {
        q.where({ createdById: req.user.get("id") });
    })
    .fetch({
        columns: ["name", "id"]
    })
    .then(function(coll) {
        res.json(coll);
    })
    .catch(next);

});

app.get("/api/views/:id", function(req, res, next) {

    View.forge({
        createdById: req.user.get("id"),
        id: req.params.id
    })
    .fetch({ require: true })
    .then(function(view) {
        res.json(view);
    })
    .catch(next);

});

module.exports = app;
