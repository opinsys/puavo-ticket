"use strict";
var React = require("react/addons");

var DropdownButton = require("react-bootstrap/lib/DropdownButton");
var MenuItem = require("react-bootstrap/lib/MenuItem");

var app = require("../../index");
var Actions = require("../../Actions");
var Ticket = require("../../models/client/Ticket");
var Loading = require("../../components/Loading").Spinner;

/**
 * ToggleStatusButton
 *
 * @namespace components
 * @class TicketView.ToggleStatusButton
 * @extends React.ReactComponent
 */
var ToggleStatusButton = React.createClass({

    getInitialState: function() {
        return { saving: false };
    },

    propTypes: {
        ticket: React.PropTypes.instanceOf(Ticket).isRequired,
        onChange: React.PropTypes.func
    },

    handleChangeStatus: function(e, status) {
        e.preventDefault();

        this.setState({ saving: true });
        var op = this.props.ticket.addTag("status:" + status);
        Actions.ajax.write(op);
        op.catch(Actions.error.haltChain("Tukipyynnön tilan muuttaminen epäonnistui"))
        .then(() => {
            if (!this.props.onChange) return;
            setImmediate(() => this.props.onChange({ target: { value: status } }));
        });
    },

    componentWillReceiveProps: function(nextProps) {
        if (this.props.ticket.getCurrentStatus() !== nextProps.ticket.getCurrentStatus()) {
            this.setState({ saving: false });
        }
    },

    getTicketStatus: function() {
        return this.props.ticket.getCurrentStatus() || "open";
    },

    getHumanReadableStatus: function() {
        var status = this.getTicketStatus();
        switch (status) {
            case "pending":
                return "Uusi";
            case "open":
                return "Käsittelyssä";
            case "closed":
                return "Ratkaistu";
            default:
                console.error("Invalid status", status);
                return "???";
        }
    },


    render: function() {
        var status = this.getTicketStatus();

        var title = this.getHumanReadableStatus();
        if (this.state.saving) {
            title = <span>{title} <Loading /></span>;
        }

        return (
            <DropdownButton disabled={this.state.saving}
                id="ToggleStatusButton"
                className={"ToggleStatusButton tsb-" + status}
                title={title}
                onSelect={this.handleChangeStatus} >

                {(status === "open" || status === "closed") &&
                    app.currentUser.acl.catSetStatusToPending() &&
                <MenuItem className="ToggleStatusButton-pending" eventKey="pending">Aseta odottavaksi</MenuItem>}

                {(status === "pending" || status === "closed") &&
                <MenuItem className="ToggleStatusButton-open" eventKey="open">Aseta käsittelyyn</MenuItem>}

                {(status === "pending" || status === "open") &&
                <MenuItem className="ToggleStatusButton-closed" eventKey="closed">Aseta ratkaistuksi</MenuItem>}

            </DropdownButton>
        );

    }
});

module.exports = ToggleStatusButton;
