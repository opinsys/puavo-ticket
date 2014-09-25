"use strict";

var spawn = require("child_process").spawn;
var watch = require("glob-watcher");
var debug = require("debug")("app:watchcss");

function writeCSS() {
    debug("Starting css write");

    var p = spawn("make", ["css"], { stdio: 'inherit' });

    p.on("error", console.error);
    p.on("exit", function(code) {
        if (code !== 0) return;
        debug("CSS DONE!");
    });
}

var w = watch([
    "styles/**/*.scss", "styles/**/*.css",
    "components/**/*.scss"
]);
w.on("error", console.error);
w.on("change", writeCSS);
writeCSS();
