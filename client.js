/** @jsx React.DOM */
"use strict";

var Promise = require("bluebird");
Promise.longStackTraces();
var $ = require("jquery");
var Backbone = require("backbone");
Backbone.$ = $;
var io = require("socket.io-client")();
window.io = io;

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

var Route = require("react-router").Route;
var Routes = require("react-router").Routes;
var Main = require("./components/Main");
var TicketForm = require("./components/TicketForm");
var TicketView = require("./components/TicketView");
var TicketList = require("./components/TicketList");
var BrowserTitle = require("./utils/BrowserTitle");

var title = new BrowserTitle({ trailingTitle: window.document.title });


React.renderComponent(
    <Routes location="history">
        <Route handler={Main} io={io} title={title}>
            <Route name="new" handler={TicketForm} />
            <Route name="tickets" path="/" handler={TicketList} />
            <Route name="ticket" path="/tickets/:id" handler={TicketView} io={io} title={title} preserveScrollPosition />
        </Route>
    </Routes>, document.getElementById("app"));


window.onerror = function(message, url, linenum) {
    var msg = "Unhandled client Javascript error: '" + message + "' on " + url + ":" + linenum;
    Backbone.trigger("error", new Error(msg));
};

