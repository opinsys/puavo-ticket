/** @jsx React.DOM */
"use strict";
var React = require("react/addons");

var SimilarTickets = require("./SimilarTickets");
var EventMixin = require("../utils/EventMixin");
var Ticket = require("../models/client/Ticket");
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
            ticketModel: this.createBoundEmitter(Ticket)
        };
    },

    handleChange: function() {
        this.state.ticketModel.set({
            description: this.refs.description.getDOMNode().value,
            title: this.refs.title.getDOMNode().value,
        });
    },



    /**
     * @method renderSimilarTickets
     */
    renderSimilarTickets: function() {
        if (routes.newTicket.match) {
            return <SimilarTickets ticketModel={this.state.ticketModel} />;
        }
    },

    /**
     * @method handleSave
     */
    handleSave: function() {
        var self = this;
        this.state.ticketModel.save().then(function(foo) {
            if (routes.existingTicket.match) return;
            LinkTicket.navigate({ id: self.state.ticketModel.get("id") });
        });
    },


    render: function() {
        console.log("render TickerForm: updates: ", this.state.ticketModel.updates().size());
        return (
            <div className="ticket-form">

                {this.state.ticketModel.isOperating() && <p>Ladataan...</p>}

                {this.renderSimilarTickets()}

                <input
                    disabled={this.state.ticketModel.isOperating()}
                    autoFocus
                    ref="title"
                    type="text"
                    onChange={this.handleChange}
                    value={this.state.ticketModel.get("title")}
                    placeholder="Otsikko" />
                <textarea
                    disabled={this.state.ticketModel.isOperating()}
                    ref="description"
                    placeholder="Kuvaus ongelmastasi"
                    value={this.state.ticketModel.get("description")}
                    onChange={this.handleChange}
                />

                <div className="button-wrap">
                    <button
                        className="button"
                        disabled={this.state.ticketModel.isOperating()}
                        onClick={this.handleSave} >Tallenna</button>
                </div>

            </div>
        );
    },


});

module.exports = TicketForm;
