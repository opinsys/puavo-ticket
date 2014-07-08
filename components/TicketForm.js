/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var Button = require("react-bootstrap/Button");
var SideInfo = require("./SideInfo");

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

    isFormOk: function() {
        return (
            this.props.ticket.get("title") &&
            this.props.ticket.get("description")
        );
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
                        disabled={this.props.ticket.isOperating()}
                        autoFocus
                        ref="title"
                        type="text"
                        onChange={this.handleChange}
                        value={this.props.ticket.get("title")}
                        placeholder="Tukipyyntöä kuvaava otsikko" />


                    <textarea
                        className="form-control"
                        disabled={this.props.ticket.isOperating()}
                        ref="description"
                        placeholder="Tarkka kuvaus tuen tarpeesta."
                        value={this.props.ticket.get("description")}
                        onChange={this.handleChange}
                    />

                    <div className="button-wrap">
                        <Button
                            className="button save-button"
                            disabled={this.props.ticket.isOperating() || !this.isFormOk()}
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
