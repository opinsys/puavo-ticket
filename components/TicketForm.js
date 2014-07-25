/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var Button = require("react-bootstrap/Button");
var Router = require('react-nested-router');

var captureError = require("puavo-ticket/utils/captureError");
var SideInfo = require("./SideInfo");
var BackboneMixin = require("puavo-ticket/components/BackboneMixin");
var Ticket = require("puavo-ticket/models/client/Ticket");

/**
 * Edit form for a ticket
 *
 * @namespace components
 * @class TicketForm
 * @extends React.ReactComponent
 */
var TicketForm = React.createClass({

    mixins: [BackboneMixin],

    getInitialState: function() {
        return {
            formDisabled: false,
            ticket: new Ticket(),
            description: "",
            title: ""
        };
    },

    handleChange: function() {
        this.setState({
            title: this.refs.title.getDOMNode().value,
            description: this.refs.description.getDOMNode().value
        });
    },

    /**
     * @method handleSave
     */
    handleSave: function() {
        this.setState({ formDisabled: true });
        this.state.ticket.replaceSave({
            title: this.state.title,
            description: this.state.description
        }).then(function(savedTicket) {
            Router.transitionTo("ticket", { id: savedTicket.get("id") });
        })
        .catch(captureError("Tukipyynnön tallennus epäonnistui"));
    },

    isFormOk: function() {
        return this.state.title.trim() && this.state.description.trim();
    },

    render: function() {
        return (
            <div className="row">
               <div className="ticket-form form-group col-md-8">
                    <div className="header">
                        <b>Uusi tukipyyntö</b><br/>
                    </div>
                    <input
                        className="form-control"
                        disabled={this.state.formDisabled}
                        autoFocus
                        ref="title"
                        type="text"
                        onChange={this.handleChange}
                        value={this.state.title}
                        placeholder="Tukipyyntöä kuvaava otsikko" />


                    <textarea
                        className="form-control"
                        disabled={this.state.formDisabled}
                        ref="description"
                        placeholder="Tarkka kuvaus tuen tarpeesta."
                        value={this.state.description}
                        onChange={this.handleChange}
                    />

                    <div className="button-wrap">
                        <Button
                            className="button save-button"
                            disabled={!this.isFormOk()}
                            onClick={this.handleSave} >Lähetä</Button>
                    </div>
                </div>
                <div className="sidebar col-md-4">
                           <SideInfo>
                            </SideInfo>
                </div>
            </div>
        );
    },


});

module.exports = TicketForm;
