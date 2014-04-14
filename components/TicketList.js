/** @jsx React.DOM */
"use strict";
var React = require("react");
var routes = require("./routes");
var Ticket = require("../models/client/Ticket");
var EventMixin = require("../EventMixin");
var LinkNewTicket = routes.LinkNewTicket;
var LinkTicket = routes.LinkTicket;


/**
 * List existing tickes
 *
 * @namespace components
 * @class TicketList
 * @extends React.ReactComponent
 * @uses components.EventMixin
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
        console.log("render TicketList");
        return (
            <div>
                <h2>Päivittyneet tukipyynnöt</h2>
                {this.state.ticketCollection.fetching && <p>Ladataan...</p>}
                <ul>
                    {this.state.ticketCollection.map(function(ticket) {
                        return (
                            <li key={ticket.get("id")}>
                                <LinkTicket id={ticket.get("id")}>
                                {ticket.get("title")}
                                </LinkTicket>
                            </li>
                        );
                    })}
                </ul>
                <LinkNewTicket>Uusi</LinkNewTicket>
            </div>
        );
    }
});

module.exports = TicketList;
