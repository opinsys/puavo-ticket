/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var DropdownButton = require("react-bootstrap/DropdownButton");
var MenuItem = require("react-bootstrap/MenuItem");
var Link = require("react-router").Link;

var User = require("app/models/client/User");
var Ticket = require("app/models/client/Ticket");

/**
 * NotificationsHub
 *
 * @namespace components
 * @class NotificationsHub
 * @constructor
 * @param {Object} props
 * @param {models.client.User} props.user
 */
var NotificationsHub = React.createClass({

    propTypes: {
        user: React.PropTypes.instanceOf(User).isRequired,
        tickets: React.PropTypes.instanceOf(Ticket.Collection).isRequired
    },

    render: function() {
        var tickets = this.props.tickets;
        var count = "("+tickets.length+")";

        var items = <MenuItem header>Ei lukemattomia päivityksiä</MenuItem>;

        if (tickets.length > 0) {
            items = tickets.map(function(ticket) {
                return <NotificationItem ticket={ticket} />;
            });
        }

        return this.transferPropsTo(
            <DropdownButton title={"Ilmoitukset " + count}>
                {items}
            </DropdownButton>
        );
    }
});

/**
 * NotificationItem
 *
 * @namespace components
 * @class NotificationsHub.NotificationItem
 * @constructor
 * @param {Object} props
 * @param {models.client.Ticket} props.ticket
 */
var NotificationItem = React.createClass({

    propTypes: {
        ticket: React.PropTypes.instanceOf(Ticket).isRequired,
    },

    render: function() {
        var ticket = this.props.ticket;
        var comment = ticket.comments()[0];

        var updateText = comment.createdBy().getFullName() +
            " lisäsi kommentin tukipyyntöön \"" +
            ticket.getCurrentTitle() + "\"";

        return (
            <MenuItem header>
                <Link to="ticket" id={ticket.get("id")}>{updateText}</Link>
            </MenuItem>
        );
    }
});

module.exports = NotificationsHub;
