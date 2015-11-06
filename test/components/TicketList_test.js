"use strict";

var sinon = window.sinon;
var $ = require("jquery");
var Route = require("../../utils/react-route");

var React = require("react");
var assert = require("assert");

var TicketList = require("../../components/TicketList");

var currentLocation = window.location.toString();

describe("TicketList", function() {

    beforeEach(function() {
        this.server = sinon.fakeServer.create();
        this.server.autoRespond = true;
    });

    afterEach(function() {
        this.server.restore();
        Route.navigate(currentLocation);
    });

    it("displays list of tickets", function() {
        this.server.respondWith("GET", "/api/tickets", [
            200,
            {  "Content-Type": "application/json" },
            JSON.stringify([
                {
                    id: 1,
                    title: "foo",
                    description: "bar"
                },
                {
                    id: 2,
                    title: "foo2",
                    description: "bar2"
                }
            ])
        ]);

        var list = React.addons.TestUtils.renderIntoDocument(<TicketList />);

        return list.state.ticketCollection.fetching.then(function() {
            var el = list.refs.list;
            var itemList = $(el).find("li").map(function(i, item) {
                return $(item).text();
            });

            assert.equal("foo", itemList[0]);
            assert.equal("foo2", itemList[1]);

        });
    });

});
