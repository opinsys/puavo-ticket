"use strict";
var fetch = require("./fetch");
var app = require("../index");

function reload() {
    window.location.reload();
}

window.addEventListener("focus", function(event) {
    fetch.get("/api/test_auth")
    .catch(function(error) {
        if (error.data.code === "NOAUTH") {
            console.log("Login has expired. Reload the page.");
            return reload();
        }
        console.error("Unknown error from loginCheck", error);
        app.handleUnhandledError(error);
    });
});
