/** @jsx React.DOM */
"use strict";
var React = require("react/addons");

var Ticket = require("../models/client/Ticket");
var EventMixin = require("../utils/EventMixin");
var navigation = require("./navigation");
var TicketViewLink = navigation.link.TicketViewLink;


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
                <h2>Päivittyneet tukipyynnöt</h2>
                {this.state.ticketCollection.fetching && <p>Ladataan...</p>}
                <ul ref="list">
                    {this.state.ticketCollection.map(function(ticket) {
                        return (
                            <li key={ticket.get("id")}>
                                <TicketViewLink id={ticket.get("id")}>
                                {ticket.get("title")} ({ticket.get("status")})
                                </TicketViewLink>
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    }
});

module.exports = TicketList;
