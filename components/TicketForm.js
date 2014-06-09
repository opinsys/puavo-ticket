/** @jsx React.DOM */
"use strict";
var React = require("react/addons");


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

                <input
                    disabled={this.props.ticket.isOperating()}
                    autoFocus
                    ref="title"
                    type="text"
                    onChange={this.handleChange}
                    value={this.props.ticket.get("title")}
                    placeholder="Tukipyyntöä kuvaava otsikko" />


                <a href="#" title=""><span title="Seuraavassa vaiheessa pääset halutessasi valitsemaan laitteet ja tunnukset">
                <textarea
                    disabled={this.props.ticket.isOperating()}
                    ref="description"
                    placeholder="Tarkka kuvaus tuen tarpeesta."
                    value={this.props.ticket.get("description")}
                    onChange={this.handleChange}
                />

                </span></a>


                <div className="button-wrap">
                    <button
                        className="button"
                        disabled={this.props.ticket.isOperating()}
                        onClick={this.handleSave} >Lähetä</button>
                </div>

            </div>
        );
    },


});

module.exports = TicketForm;
