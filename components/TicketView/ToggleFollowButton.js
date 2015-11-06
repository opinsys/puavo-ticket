"use strict";

var React = require("react");
var Button = require("react-bootstrap/lib/Button");

var Ticket = require("../../models/client/Ticket");
var User = require("../../models/client/User");
var Actions = require("../../Actions");


/**
 * ToggleFollowButton
 *
 * @namespace components
 * @class TicketView.ToggleFollowButton
 * @constructor
 * @param {Object} props
 * @param {models.client.Ticket} props.ticket
 * @param {models.client.User} props.user
 */
var ToggleFollowButton = React.createClass({

    propTypes: {
        user: React.PropTypes.instanceOf(User).isRequired,
        ticket: React.PropTypes.instanceOf(Ticket).isRequired,
    },

    getInitialState: function() {
        return {
            fetching: false
        };
    },

    onClick: function(e) {
        var ticket = this.props.ticket;
        this.setState({ fetching: true });

        var op;
        if (this.props.ticket.isFollower(this.props.user)) {
            op = ticket.removeFollower(this.props.user);
        } else {
            op = ticket.addFollower(this.props.user);
        }

        Actions.ajax.write(op);
        op.catch(Actions.error.haltChain("Tukipyynnön seuraaminen epäonnistui"))
        .then(Actions.refresh);

    },

    componentWillReceiveProps: function(nextProps) {
        var followingChanged = (
            this.props.ticket.isFollower(this.props.user) !==
            nextProps.ticket.isFollower(this.props.user));

        if (followingChanged) {
            // remove spinner on successful toggle
            this.setState({ fetching: false });
        }
    },

    render: function() {
        var isFollower = this.props.ticket.isFollower(this.props.user);

        var icon = "fa " + (isFollower ? "fa-check-square-o" : "fa-square-o");
        if (this.state.fetching) icon = "fa fa-spinner";


        return (
            <Button bsStyle="primary" onClick={this.onClick}>
                <i className={icon}></i> Seuraa
            </Button>
        );
    }

});

module.exports = ToggleFollowButton;
