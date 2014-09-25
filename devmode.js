"use strict";
/**
 * Watch the client side files for changes and write new bundle using watchify.
 * An `update` event is emitted when the bundle is fully written.
 * */

var browserify = require("browserify");
var debug = require("debug")("app:devmode");
var EventEmitter = require("events").EventEmitter;
var fs = require("fs");
var path = require("path");
var spawn = require("child_process").spawn;
var watchify = require("watchify");
var watch = require("glob-watcher");


var em = new EventEmitter();

var b = browserify({
    entries: __dirname + "/client.js",
    debug: true,
    cache: {},
    packageCache: {},
    fullPaths: true
});

function writeJS() {
    debug("Starting js write");

    var outfile = __dirname + "/public/build/bundle.js";
    var dotfile = path.join(path.dirname(outfile), '.' + path.basename(outfile));
    var wb = b.bundle();
    wb.on("error", console.error);
    wb.pipe(fs.createWriteStream(dotfile));
    wb.on("end", function() {
        fs.rename(dotfile, outfile, function (err) {
            if (err) return console.error(err);
            debug("js ok");
            em.emit("jschange");
            em.emit("assetchange");
        });
    });
}

function writeCSS() {
    debug("Starting css write");

    var p = spawn("make", ["css"], { stdio: "inherit" });

    p.on("error", console.error);
    p.on("exit", function(code) {
        if (code !== 0) return;
        debug("css ok");
        em.emit("csschange");
        em.emit("assetchange");
    });
}

var w = watchify(b);
w.setMaxListeners(Infinity);
w.on("update", writeJS);

var cssWatcher = watch([
    "styles/**/*.scss", "styles/**/*.css",
    "components/**/*.scss"
]);
cssWatcher.on("error", console.error);
cssWatcher.on("change", writeCSS);

writeJS();
writeCSS();

module.exports = em;
