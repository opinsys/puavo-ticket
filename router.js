/** @jsx React.DOM */
"use strict";

var Router = require("react-router");
var Route = Router.Route;
var Redirect = Router.Redirect;

var Main = require("./components/Main");
var TicketForm = require("./components/TicketForm");
var TicketView = require("./components/TicketView");
var Views = require("./components/Views");
var ViewTabs = require("./components/ViewTabs");
var Solved = require("./components/Solved");
var ViewEditor = require("./components/ViewEditor");
var TagEditor = require("./components/TicketView/TagEditor");
var HandlerEditor = require("./components/TicketView/HandlerEditor");
var Discuss = require("./components/TicketView/Discuss");

var routes = (
    <Route handler={Main} >
        <Route name="new" handler={TicketForm} />
        <Redirect name="tickets" from="/" to="view" params={{id: "open"}} />
        <Route name="view-editor" path="/edit-view/:name?" handler={ViewTabs} >
            <Route handler={ViewEditor} />
        </Route>
        <Route name="view" path="/views/:id" handler={ViewTabs} >
            <Route handler={Views} />
        </Route>
        <Route name="solved-tickets" path="/solved" handler={Solved} />
        <Redirect from="/tickets/:id" to="discuss" />
        <Route name="ticket" path="/tickets/:id" handler={TicketView} >
            <Route name="tags" path="tags" handler={TagEditor} />
            <Route name="handlers" path="handlers" handler={HandlerEditor} />
            <Route name="discuss" handler={Discuss} />
        </Route>
    </Route>
);


var router = Router.create({
    scrollBehavior: {
        // No scrolling
        updateScrollPosition: function() { }
    },
    routes: routes,
    location: Router.HistoryLocation
});

module.exports = router;
