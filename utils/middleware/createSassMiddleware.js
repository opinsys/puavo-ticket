"use strict";
var path = require("path");
var sass = require("node-sass");
var Promise = require("bluebird");


function renderSass(opts) {
    return new Promise(function(resolve, reject){
        return sass.render({
            file: opts.file,
            sourceComments: "map",
            sourceMap: path.basename(opts.file) + ".map",
            success: function(css, map, foo) {
                resolve({ css: css, map: map });
            },
            error: reject
        });
    });
}

function fixMap(map) {
    if (!map) throw new Error("Invalid map string!");
    map = JSON.parse(map);
    map.sources = map.sources.map(function(s) {
        return s.replace("styles/", "");
    });
    return JSON.stringify(map);
}



function createSassMiddleware(opts) {
    return function(req, res, next) {

        if (opts.url === req.url) {
            return renderSass(opts)
                .then(function(cssres) {
                    res.set("content-type", "text/css");
                    res.send(cssres.css);
                }).catch(next);
        } else if (req.url.match(/map$/)) {
            return renderSass(opts)
                .then(function(cssres) {
                    res.set("content-type", "application/json");
                    res.send(fixMap(cssres.map));
                }).catch(next);
        }

        next();
    };
}

module.exports = createSassMiddleware;
