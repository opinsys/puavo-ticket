/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var Button = require("react-bootstrap/Button");
var Router = require("react-router");
var Promise = require("bluebird");

var captureError = require("../utils/captureError");
var SideInfo = require("./SideInfo");
var Loading = require("./Loading");
var ElasticTextarea = require("./ElasticTextarea");

var BackboneMixin = require("../components/BackboneMixin");
var Ticket = require("../models/client/Ticket");

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
            saving: false,
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
        this.setState({ saving: true });

        new Ticket({})
        .save()
        .bind(this)
        .then(function(savedTicket) {
            return Promise.all([
                savedTicket.addTitle(this.state.title),
                savedTicket.addComment(this.state.description)
            ]).return(savedTicket);
        })
        .then(function(savedTicket) {
            Router.transitionTo("ticket", { id: savedTicket.get("id") });
        })
        .catch(captureError("Tukipyynnön tallennus epäonnistui"));
    },

    isFormOk: function() {
        return this.state.title.trim() && this.state.description.trim();
    },

    render: function() {
        return (
            <div className="row TicketForm">
               <div className="ticket-form form-group col-md-8">
                    <div className="header">
                        <h3>Uusi tukipyyntö</h3>
                    </div>
                    <input
                        className="form-control"
                        disabled={this.state.saving}
                        autoFocus
                        ref="title"
                        type="text"
                        onChange={this.handleChange}
                        value={this.state.title}
                        placeholder="Tukipyyntöä kuvaava otsikko" />


                    <ElasticTextarea
                        minRows="10"
                        className="form-control"
                        disabled={this.state.saving}
                        ref="description"
                        placeholder="Tarkka kuvaus tuen tarpeesta."
                        value={this.state.description}
                        onChange={this.handleChange}
                    />

                    <div className="button-wrap">
                        <Button
                            className="button save-button"
                            disabled={!this.isFormOk() || this.state.saving}
                            onClick={this.handleSave} >
                            Lähetä {this.state.saving && <Loading.Spinner />}
                        </Button>
                    </div>
                </div>

                <div className="col-md-4">
                    <SideInfo />
                </div>

            </div>
        );
    },


});

module.exports = TicketForm;
