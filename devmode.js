"use strict";
/**
 * Watch the client side files for changes and write new bundle using watchify.
 * An `update` event is emitted when the bundle is fully written.
 * */

var fs = require("fs");
var spawn = require("child_process").spawn;
var webpack = require("webpack");
var watch = require("glob-watcher");
var _ = require("lodash");

var webpackCompiler = webpack(require("./webpack.config"));


/**
 * @param {Object} sio Socket.IO instance
 */
function startDevMode(sio) {

    var logStream = fs.createWriteStream("./client-build.log");
    function log(message) {
        console.log(message);
        logStream.write(message.toString() + "\n");
    }

    log("Devmode started");

    function handleWebpackError(err) {
        sio.sockets.emit("jserror", err);
    }

    webpackCompiler.plugin("compile", function() {
        log("JS starting");
        sio.sockets.emit("jschangebegin");
    });

    webpackCompiler.watch(200, function(err, stats) {
        if(err) {
            return handleWebpackError(err);
        }
        var jsonStats = stats.toJson();
        if(jsonStats.errors.length > 0) {
            jsonStats.errors.forEach(function(err) {
                log(err);
            });
            return handleWebpackError(jsonStats.errors);
        }
        if(jsonStats.warnings.length > 0) {
            handleWebpackError(jsonStats.warnings);
        }

        log("JS OK");
        sio.sockets.emit("jschange");
        sio.sockets.emit("assetchange");
    });

    function writeCSS() {

        var p = spawn("make", ["css"], { stdio: "inherit" });

        p.on("error", console.error);
        p.on("exit", function(code) {
            if (code !== 0) return;
            log("CSS OK");
            sio.sockets.emit("csschange");
            sio.sockets.emit("assetchange");
        });
    }

    var cssWatcher = watch([
        "styles/**/*.scss", "styles/**/*.css",
        "components/**/*.scss"
    ]);

    cssWatcher.on("error", function(err) {
        console.error(err);
        log("CSS watching error: " + err.message);
    });

    cssWatcher.on("change", _.debounce(writeCSS, 100));
    writeCSS();
}


module.exports = startDevMode;
