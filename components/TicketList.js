/** @jsx React.DOM */
"use strict";
var React = require("react/addons");

var Ticket = require("../models/client/Ticket");
var navigation = require("./navigation");
var TicketViewLink = navigation.link.TicketViewLink;

function isClosed(ticket) {
    return ticket.getCurrentStatus() === "closed";
}

function isOpen(ticket) {
    return ticket.getCurrentStatus() === "open";
}

var List = React.createClass({

    render: function() {
        var self = this;
        return (
            <ul ref="list">
                {this.props.tickets.map(function(ticket) {
                    return (
                        <li key={ticket.get("id")}>
                            <TicketViewLink
                                id={ticket.get("id")}
                                onClick={self.props.onSelect.bind(null, ticket)} >
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
 */
var TicketList = React.createClass({


    getInitialState: function() {
        return {
            ticketCollection: Ticket.collection(),
        };
    },

    componentDidMount: function() {
        this.state.ticketCollection.fetch();
    },

    render: function() {
        return (
            <div>
                {this.state.ticketCollection.fetching && <p>Ladataan...</p>}
                <h2>Avoimet tukipyynnöt</h2>
                <List onSelect={this.props.onSelect}
                      tickets={this.state.ticketCollection.filter(isOpen)} />

                <h2>Suljetut tukipyynnöt</h2>
                <List onSelect={this.props.onSelect}
                      tickets={this.state.ticketCollection.filter(isClosed)} />
            </div>
        );
    }
});

module.exports = TicketList;
