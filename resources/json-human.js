"use strict";


function prettyJSONResponse(req, res, next) {
    if (!req.query.human) return next();
    res.json = function(data) {
        res.render("json-human.ejs", {data:data, path: req.path});
    };
    next();
}

module.exports = prettyJSONResponse;
