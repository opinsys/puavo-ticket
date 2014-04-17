/** @jsx React.DOM */
"use strict";

var sinon = window.sinon;
var Route = require("../../utils/react-route");

var React = require("react/addons");
var assert = require("assert");

var TicketForm = require("../../components/TicketForm");
var routes = require("../../components/routes");

var currentLocation = window.location.toString();

describe("TicketForm", function() {

    beforeEach(function() {
        this.server = sinon.fakeServer.create();
        this.server.autoRespond = true;
    });

    afterEach(function() {
        this.server.restore();
        Route.navigate(currentLocation);
    });

    it("displays empty form on /", function() {
        Route.navigate("/");
        var form = React.addons.TestUtils.renderIntoDocument(<TicketForm />);
        assert(!form.refs.comment, "new ticket form must not have comments input");
        assert.equal(form.refs.title.getDOMNode().value, "");
        assert.equal(form.refs.description.getDOMNode().value, "");
    });

    it("loads a ticket on /tickets/1", function() {
        this.server.respondWith("GET", "/api/tickets/1", [
            200,
            {  "Content-Type": "application/json" },
            JSON.stringify({
                title: "foo",
                description: "bar"
            })
        ]);

        this.server.respondWith("GET", "/api/tickets/1/comments", [
            200,
            {  "Content-Type": "application/json" },
            JSON.stringify([])
        ]);

        routes.LinkTicket.navigate({ id: 1 });

        var form = React.addons.TestUtils.renderIntoDocument(<TicketForm />);

        return form.state.ticketModel.fetching
        .then(function() {
            assert.equal(form.refs.title.getDOMNode().value, "foo");
            assert.equal(form.refs.description.getDOMNode().value, "bar");
            assert(form.refs.comment, "has comments input");
        });

    });

});
