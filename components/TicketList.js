/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var _ = require("lodash");

var Ticket = require("../models/client/Ticket");
var navigation = require("./navigation");
var TicketViewLink = navigation.link.TicketViewLink;

function isClosed(ticket) {
    return ticket.getCurrentStatus() === "closed";
}

function isOpen(ticket) {
    return ticket.getCurrentStatus() === "open";
}

function isHandledBy(user, ticket) {
    return !!_.find(ticket.get("handlers"), function(handler) {
        return handler.handler.id === user.get("id");
    });
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
        var handledByMe = this.state.ticketCollection
                          .filter(isOpen)
                          .filter(isHandledBy.bind(null, this.props.user));

        return (
            <div>
                <p>ticket count: {this.state.ticketCollection.size()}</p>
                {this.state.ticketCollection.fetching && <p>Ladataan...</p>}

                {handledByMe.length > 0 && <div>
                    <h2>Minulle osoitetut avoimet tukipyynnöt</h2>
                    <List onSelect={this.props.onSelect} tickets={handledByMe} />
                </div>}

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
