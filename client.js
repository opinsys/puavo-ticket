/** @jsx React.DOM */
"use strict";
require("./polyfills");

var Promise = require("bluebird");
Promise.longStackTraces();
var $ = require("jquery");
var Backbone = require("backbone");
Backbone.$ = $;
var io = require("socket.io-client")();
window.io = io;

var User = require("app/models/client/User");
var app = require("app");
app.currentUser = new User(window.USER);

io.on("connect", function(s) {
    console.log("Socket.IO connected");
});

io.on("jschangebegin", function() {
    window.document.title = "!COMPILING!";
    window.document.body.innerHTML = "<h1>Compiling Javascript...</h1>";
});

io.on("jschange", function() {
    window.document.title = "!RELOADING!";
    window.document.body.innerHTML += "<h1>Ok. Reloading...</h1>";
    window.location.reload();
});

io.on("jserror", function(err) {
    window.document.title = "!FAILED!";
    window.document.body.innerHTML += "<h1>Failed</h1>";
    window.document.body.innerHTML += "<pre>" + err.stack + "</pre>";
});

io.on("csschange", function() {
    // Refresh stylesheets when css has been changed
    var links = document.getElementsByTagName("link");
    var queryString = "?reload=" + new Date().getTime();
    for (var i = 0; i < links.length;i++) {
        var link = links[i];
        if (link.rel === "stylesheet") {
            link.href = link.href.replace(/\?.*|$/, queryString);
        }
    }
});

// Load Finnish locale for Moment
require("moment/locale/fi");

// Make it possible to enable debug logs
window.debug = require("debug");

var React = require("react/addons");
// React devtools requires a global access to the React object to work
// http://fb.me/react-devtools
window.React = React;


var ErrorMessage = require("./components/ErrorMessage");
var BrowserTitle = require("./utils/BrowserTitle");

app.title = new BrowserTitle({ trailingTitle: window.document.title });
app.io = io;

var appContainer = document.getElementById("app");


var router = require("./router");
app.router = router;
require("./ajax");

router.run(function(Handler, state) {
    React.render(<Handler params={state.params} query={state.query} />, appContainer);
});

/**
 * Render given error to the body using plain javascript overriding everything else
 */
var renderLowLevelErrorMessage = function (error, source) {
    // Only render the initial error message
    renderLowLevelErrorMessage = function(e) { throw e; };

    // Try to remove the application
    try {
        React.unmountComponentAtNode(appContainer);
    } catch (err) { }

    var html = "<h1>Virhe :(</h1>";
    html += "Sovellus kaatui. ";
    html += '<a href="" >Lataa sivu uusiksi</a> ja yritä uudelleen. ';
    html += 'Jos ongelma ei poistu ota yhteyttä puhelimitse tukeen <a href="tel:014-4591625">014-4591625</a> ';
    html += '<pre id="errorContainer"></pre>';
    document.body.innerHTML = html;
    var errorContainer = document.getElementById("errorContainer");
    errorContainer.textContent = ErrorMessage.formatError(error, source);
    throw error;
};

if (process.env.NODE_ENV === "production") {
    // On unhandled errors the UI might get just stuck which is very confusing
    // for the user. So force render a proper error message for the user so
    // she/he will know that an error happened.
    window.onerror = function(message, filename, lineno, colno, error) {
        if (error) {
            // If the browser actually provides an error object render it
            renderLowLevelErrorMessage(error, "window.onerror");
        } else {
            // Otherwise create one
            renderLowLevelErrorMessage(new Error("window.onerror: " + message), "window.onerror");
        }
    };

    Promise.onPossiblyUnhandledRejection(function(error, promise) {
        renderLowLevelErrorMessage(error, "Promise");
    });

} else {
    // In development just throw the promise error so that the devtools can capture it
    Promise.onPossiblyUnhandledRejection(function(error, promise) {
        console.warn("Possibly unhandled rejection: " + error.message, error);
        throw error;
    });
}

