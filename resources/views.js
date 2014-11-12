"use strict";

var express = require("express");
var app = express.Router();

var View = require("app/models/server/View");


app.post("/api/views", function(req, res, next) {

    View.fetchOrCreate({
        createdById: req.user.get("id"),
        name: req.body.name,
    })
    .then(function(view) {
        return view.set({
            createdById: req.user.get("id"),
            name: req.body.name,
            query: req.body.query
        })
        .save();
    })
    .then(function(view) {
        res.json(view);
    })
    .catch(next);
});


app.get("/api/views", function(req, res, next) {

    View.collection()
    .query(function(q) {
        q.orderBy("createdAt", "asc");
        q.where({
            createdById: req.user.get("id")
        });

        if (req.query.name) {
            q.where({ name: req.query.name });
        }
    })
    .fetch()
    .then(function(coll) {
        res.json(coll);
    })
    .catch(next);

});

app.delete("/api/views/:id", function(req, res, next) {

    View.forge({
        createdById: req.user.get("id"),
        id: req.params.id
    })
    .fetch({ require: true })
    .then(function(view) {
        res.json(view.destroy());
    })
    .catch(next);

});

module.exports = app;
