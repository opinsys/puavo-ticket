"use strict";
var multiparty = require('multiparty');

function isMultipartPost(req) {
    return (
        req.method === "POST" &&
        req.headers["content-type"] &&
        req.headers["content-type"].indexOf("multipart/form-data") !== -1
    );
}

/**
 * @namespace utils.middleware
 * @class createMultipartMiddleware
 * @constructor
 */
function createMultipartMiddleware() {
    return function(req, res, next){
        if (!isMultipartPost(req)) return next();

        var form = new multiparty.Form();
        form.parse(req, function(err, fields, files){
            req.files = files;
            next();
        });

    };
}


module.exports = createMultipartMiddleware;
