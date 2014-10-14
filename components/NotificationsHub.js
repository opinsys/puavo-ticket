/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var DropdownButton = require("react-bootstrap/DropdownButton");
var MenuItem = require("react-bootstrap/MenuItem");
var Link = require("react-router").Link;

var Ticket = require("app/models/client/Ticket");

/**
 * NotificationsHub
 *
 * @namespace components
 * @class NotificationsHub
 * @constructor
 * @param {Object} props
 */
var NotificationsHub = React.createClass({

    render: function() {
        var count = 0;
        var items = [];
        [].concat(this.props.children).forEach(function(child) {
            if (!child) return;
            var key = child.props.title;

            items.push(<MenuItem key={key} header>{child.props.title}</MenuItem>);
            child.props.tickets.forEach(function(ticket) {
                count += 1;
                var itemKey = key + ticket.get("id");
                items.push(<NotificationItem key={itemKey} ticket={ticket} />);
            });
        });

        return this.transferPropsTo(
            <DropdownButton pullRight className="NotificationsHub" title={"Ilmoitukset " + count}>
                {items}
            </DropdownButton>
        );
    }
});

/**
 * @namespace components
 * @class NotificationsHub.TicketGroup
 * @constructor
 * @param {Object} props
 */
var TicketGroup = React.createClass({
    propTypes: {
        title: React.PropTypes.string.isRequired,
        tickets: React.PropTypes.instanceOf(Ticket.Collection).isRequired
    },

    render: function() {
        throw new Error("Meta component. Do not actually render me.");
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
        var title = ticket.getCurrentTitle();
        return (
            <MenuItem header>
                <Link to="ticket"
                      query={{scrollTo: "firstUnread" }}
                      params={{id: ticket.get("id")}}>{title}</Link>
            </MenuItem>
        );
    }
});

NotificationsHub.TicketGroup = TicketGroup;
module.exports = NotificationsHub;
