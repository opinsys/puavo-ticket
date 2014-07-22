/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var Backbone = require("backbone");

var Button = require("react-bootstrap/Button");

/**
 * ToggleStatusButton
 *
 * @namespace components
 * @private
 * @class TicketView.ToggleStatusButton
 */
var ToggleStatusButton = React.createClass({

    handleOpenTicket: function() {
        this.props.ticket.setOpen(this.props.user)
        .catch(Backbone.trigger.bind(Backbone, "error"));
    },

    handleCloseTicket: function() {
        this.props.ticket.setClosed(this.props.user)
        .catch(Backbone.trigger.bind(Backbone, "error"));
    },

    render: function() {
        var ticket = this.props.ticket;
        var status = ticket.getCurrentStatus();

        if (!status) return (
            <Button disabled >loading...</Button>
        );

        if (status === "open") return (
            <Button
                bsStyle="success"
                className="close-ticket"
                disabled={ticket.isOperating()}
                onClick={this.handleCloseTicket} >
                <i className="fa fa-check"></i>Aseta ratkaistuksi</Button>
        );

        return (
            <Button
                bsStyle="warning"
                className="reopen-ticket"
                disabled={ticket.isOperating()}
                onClick={this.handleOpenTicket} >
                <i className="fa fa-refresh"></i>Avaa uudelleen</Button>
        );

    }
});

module.exports = ToggleStatusButton;
