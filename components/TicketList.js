/** @jsx React.DOM */
"use strict";
var React = require("react/addons");

var Ticket = require("../models/client/Ticket");
var EventMixin = require("../utils/EventMixin");
var navigation = require("./navigation");
var TicketViewLink = navigation.link.TicketViewLink;

function isClosed(ticket) {
    return ticket.get("status") === "closed";
}

function isOpen(ticket) {
    return ticket.get("status") === "open";
}

var List = React.createClass({
    render: function() {
        return (
            <ul ref="list">
                {this.props.tickets.map(function(ticket) {
                    return (
                        <li key={ticket.get("id")}>
                            <TicketViewLink id={ticket.get("id")}>
                            {ticket.get("title")}
                            </TicketViewLink>
                        </li>
                    );
                })}
            </ul>
        );
    }
});

/**
 * List existing tickes
 *
 * @namespace components
 * @class TicketList
 * @extends React.ReactComponent
 * @uses utils.EventMixin
 */
var TicketList = React.createClass({

    mixins: [EventMixin],

    getInitialState: function() {
        return {
            ticketCollection: Ticket.collection(),
        };
    },

    componentWillMount: function() {
        this.reactTo(this.state.ticketCollection);
        this.state.ticketCollection.fetch();
    },

    render: function() {
        return (
            <div>
                {this.state.ticketCollection.fetching && <p>Ladataan...</p>}
                <h2>Avoimet tukipyynnöt</h2>
                <List tickets={this.state.ticketCollection.filter(isOpen)} />

                <h2>Suljetut tukipyynnöt</h2>
                <List tickets={this.state.ticketCollection.filter(isClosed)} />
            </div>
        );
    }
});

module.exports = TicketList;
