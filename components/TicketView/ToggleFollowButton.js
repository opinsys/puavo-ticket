/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var Button = require("react-bootstrap/Button");
var Ticket = require("../../models/client/Ticket");
var User = require("../../models/client/User");


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

        (this.props.ticket.isFollower(this.props.user) ?
            ticket.removeFollower(this.props.user) :
            ticket.addFollower(this.props.user)
        ).then(function() {
            return ticket.fetch();
        })
        .bind(this)
        .then(function() {
            if (!this.isMounted()) return;
            this.setState({ fetching: false });
        });

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
