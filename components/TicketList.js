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

/**
 * Return true if the needle model is not in the haystack array
 *
 * @private
 * @method notIn
 * @param {Array} haystack Array of tickets
 * @param {Backbone.Modle} needle
 * @return {Boolean}
 */
function notIn(haystack, needle) {
    return !haystack.some(function(existing) {
        return existing.get("id") === needle.get("id");
    });
}

var List = React.createClass({

    getTitleClass: function(ticket, userId) {
        if (ticket.hasRead( userId )) {
            return "read";
        }
        return "unread";
    },


    render: function() {
        var self = this;

        return (
            <ul ref="list">
                {this.props.tickets.map(function(ticket) {
                    return (
                            <li key={ticket.get("id")} className={ self.getTitleClass(ticket, self.props.user.get("id")) }>
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
        var handledByCurrentUser = this.state.ticketCollection
          .filter(isOpen)
          .filter(isHandledBy.bind(null, this.props.user));

        return (
            <div>
                <p>ticket count: {this.state.ticketCollection.size()}</p>
                {this.state.ticketCollection.fetching && <p>Ladataan...</p>}

                {handledByCurrentUser.length > 0 && <div>
                    <h2>Minulle osoitetut avoimet tukipyynnöt</h2>
                    <List onSelect={this.props.onSelect} tickets={handledByCurrentUser} />
                </div>}

                <h2>Avoimet tukipyynnöt</h2>
                <List onSelect={this.props.onSelect}
                    user={this.props.user}
                    tickets={this.state.ticketCollection
                    .filter(isOpen)
                    .filter(notIn.bind(null, handledByCurrentUser))} />

                <h2>Suljetut tukipyynnöt</h2>
                <List onSelect={this.props.onSelect}
                      tickets={this.state.ticketCollection.filter(isClosed)} />
            </div>
        );
    }
});

module.exports = TicketList;
