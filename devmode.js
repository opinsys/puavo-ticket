"use strict";
/**
 * Watch the client side files for changes and write new bundle using watchify.
 * An `update` event is emitted when the bundle is fully written.
 * */

var browserify = require("browserify");
var debug = require("debug")("app:devmode");
var fs = require("fs");
var path = require("path");
var spawn = require("child_process").spawn;
var watchify = require("watchify");
var watch = require("glob-watcher");


var sio;

var b = browserify({
    entries: __dirname + "/client.js",
    debug: true,
    cache: {},
    packageCache: {},
    fullPaths: true
});

var compilingJS = false;
var requestRecompileJS = false;
function writeJS() {
    if (compilingJS) {
        requestRecompileJS = true;
        debug("JS compiling in progress. Queueing compile");
        return;
    }
    compilingJS = true;

    debug("Starting js write");
    sio.sockets.emit("jschangebegin");

    var outfile = __dirname + "/public/build/bundle.js";
    var dotfile = path.join(path.dirname(outfile), '.' + path.basename(outfile));
    var wb = b.bundle();
    wb.on("error", function(err) {
        console.error(err.stack);
        sio.sockets.emit("jserror", {
            stack: err.stack
        });
    });
    wb.pipe(fs.createWriteStream(dotfile));
    wb.on("end", function() {

        fs.rename(dotfile, outfile, function (err) {
            compilingJS = false;
            if (err) console.error(err);
            if (requestRecompileJS) {
                requestRecompileJS = false;
                return writeJS();
            }

            if (err) return;

            debug("js ok");
            sio.sockets.emit("jschange");
            sio.sockets.emit("assetchange");
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
        sio.sockets.emit("csschange");
        sio.sockets.emit("assetchange");
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


/**
 * @param {Object} sio Socket.IO instance
 */
module.exports = function(_sio) {
    sio = _sio;
    writeJS();
    writeCSS();
    return {
        writeJS: writeJS,
        writeCSS: writeCSS
    };
};
