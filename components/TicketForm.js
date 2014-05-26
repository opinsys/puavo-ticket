/** @jsx React.DOM */
"use strict";
var React = require("react/addons");

var SimilarTickets = require("./SimilarTickets");

/**
 * Edit form for a ticket
 *
 * @namespace components
 * @class TicketForm
 * @extends React.ReactComponent
 */
var TicketForm = React.createClass({

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
     * @method handleSave
     */
    handleSave: function() {
        var self = this;
        this.props.ticket.save().then(function() {
            self.props.onSaved(self.props.ticket);
        });
    },


    render: function() {
        return (
            <div className="ticket-form">

                {this.props.ticket.isOperating() && <p>Ladataan...</p>}

                <SimilarTickets ticketModel={this.props.ticket} />

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
