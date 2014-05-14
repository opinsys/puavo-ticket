/** @jsx React.DOM */
"use strict";
var React = require("react/addons");

var SimilarTickets = require("./SimilarTickets");
var EventMixin = require("../utils/EventMixin");
var routes = require("./routes");

var LinkTicket = routes.LinkTicket;


/**
 * Edit form for a ticket
 *
 * @namespace components
 * @class TicketForm
 * @extends React.ReactComponent
 * @uses utils.EventMixin
 */
var TicketForm = React.createClass({

    mixins: [EventMixin],

    getInitialState: function() {
        return {
            description: "",
            title: ""
        };
    },

    handleChange: function() {
        this.props.ticket.set({
            description: this.refs.description.getDOMNode().value,
            title: this.refs.title.getDOMNode().value
        });
    },

    /**
     * @method renderSimilarTickets
     */
    renderSimilarTickets: function() {
        if (routes.newTicket.isMatch()) {
            return <SimilarTickets ticketModel={this.props.ticket} />;
        }
    },

    /**
     * @method handleSave
     */
    handleSave: function() {
        var self = this;
        this.props.ticket.save().then(function(foo) {
            if (routes.existingTicket.match) return;
            LinkTicket.go({ id: self.props.ticket.get("id") });
        });
    },


    render: function() {
        return (
            <div className="ticket-form">

                {this.props.ticket.isOperating() && <p>Ladataan...</p>}

                {this.renderSimilarTickets()}

                <input
                    disabled={this.props.ticket.isOperating()}
                    autoFocus
                    ref="title"
                    type="text"
                    onChange={this.handleChange}
                    value={this.props.ticket.get("title")}
                    placeholder="Otsikko" />
                <textarea
                    disabled={this.props.ticket.isOperating()}
                    ref="description"
                    placeholder="Kuvaus ongelmastasi"
                    value={this.props.ticket.get("description")}
                    onChange={this.handleChange}
                />

                <div className="button-wrap">
                    <button
                        className="button"
                        disabled={this.props.ticket.isOperating()}
                        onClick={this.handleSave} >Tallenna</button>
                </div>

            </div>
        );
    },


});

module.exports = TicketForm;
