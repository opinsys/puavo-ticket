/** @jsx React.DOM */
"use strict";
var React = require("react/addons");

var Button = require("react-bootstrap/Button");


var Spinner = require("../Loading").Spinner;
var captureError = require("../../utils/captureError");

/**
 * ToggleStatusButton
 *
 * @namespace components
 * @class TicketView.ToggleStatusButton
 * @extends React.ReactComponent
 */
var ToggleStatusButton = React.createClass({

    getInitialState: function() {
        return {
            saving: false
        };
    },


    handleChangeState: function() {
        this.setState({ saving: true });
        var op;
        if (this.getTicketStatus() === "open") {
            op = this.props.ticket.setClosed(this.props.user);
        } else {
            op = this.props.ticket.setOpen(this.props.user);
        }

        op.bind(this)
        .then(function() {
            return this.props.ticket.fetch();
        })
        .then(function() {
            if (this.isMounted()) this.setState({ saving: false });
        })
        .catch(captureError("Tukipyynnön tilan muuttaminen epäonnistui"));
    },

    getTicketStatus: function() {
        return this.props.ticket.getCurrentStatus() || "open";
    },

    render: function() {

        if (this.state.saving) return (
            <Button disabled >
                <Spinner /> Tallennetaan...
            </Button>
        );

        if (this.getTicketStatus() === "open") return (
            <Button
                bsStyle="success"
                className="close-ticket"
                onClick={this.handleChangeState} >
                <i className="fa fa-check"></i>Aseta ratkaistuksi</Button>
        );

        return (
            <Button
                bsStyle="warning"
                className="reopen-ticket"
                onClick={this.handleChangeState} >
                <i className="fa fa-refresh"></i>Avaa uudelleen</Button>
        );

    }
});

module.exports = ToggleStatusButton;
