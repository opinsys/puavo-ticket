/** @jsx React.DOM */
"use strict";

var Promise = require("bluebird");
Promise.longStackTraces();
var $ = require("jquery");
var Backbone = require("backbone");
Backbone.$ = $;
var io = require("socket.io-client")();
window.io = io;
var Route = require("react-router").Route;
var Routes = require("react-router").Routes;
var DefaultRoute = require("react-router").DefaultRoute;

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



var User = require("app/models/client/User");
var Main = require("./components/Main");
var TicketForm = require("./components/TicketForm");
var TicketView = require("./components/TicketView");
var FrontPage = require("./components/FrontPage");
var Solved = require("./components/Solved");
var CustomList = require("./components/CustomList");
var TagEditor = require("./components/TicketView/TagEditor");
var Discuss = require("./components/TicketView/Discuss");
var BrowserTitle = require("./utils/BrowserTitle");

var loggedInUser = new User(window.USER);
var title = new BrowserTitle({ trailingTitle: window.document.title });

React.renderComponent(
    <Routes location="history">
        <Route handler={Main} io={io} title={title} user={loggedInUser}>
            <Route name="new" handler={TicketForm} />
            <Route name="tickets" path="/" handler={FrontPage} />
            <Route name="solved-tickets" path="/solved" handler={Solved} />
            <Route name="custom-list" path="/custom" handler={CustomList} />
            <Route name="ticket" path="/tickets/:id" handler={TicketView} user={loggedInUser} >
                <Route name="tags" path="tags" handler={TagEditor} user={loggedInUser} />
                <DefaultRoute handler={Discuss} io={io} title={title} user={loggedInUser} />
            </Route>
        </Route>
    </Routes>, document.getElementById("app"));


window.onerror = function(message, url, linenum) {
    var msg = "Unhandled client Javascript error: '" + message + "' on " + url + ":" + linenum;
    Backbone.trigger("error", new Error(msg));
};

