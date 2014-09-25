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

io.on("reload", function() {
    window.location.reload();
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

// Clear spinners
document.body.innerHTML = "";

React.renderComponent(
    <Routes location="history">
        <Route handler={Main} io={io} title={title}>
            <Route name="new" handler={TicketForm} />
            <Route name="tickets" path="/" handler={TicketList} />
            <Route name="ticket" path="/tickets/:id" handler={TicketView} io={io} title={title} preserveScrollPosition />
        </Route>
    </Routes>, document.body);


window.onerror = function(message, url, linenum) {
    var msg = "Unhandled client Javascript error: '" + message + "' on " + url + ":" + linenum;
    Backbone.trigger("error", new Error(msg));
};

