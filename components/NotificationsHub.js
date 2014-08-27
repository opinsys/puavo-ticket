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
    },

    getInitialState: function() {
        return {
            tickets: []
        };
    },

    fetchNotifications: function() {
        return Ticket.fetchWithUnreadComments()
            .bind(this)
            .then(function(tickets) {
                if (!this.isMounted()) return;
                this.setState({ tickets: tickets });
            });
    },

    componentDidMount: function() {
        this.fetchNotifications();
        window.addEventListener("focus", this.fetchNotifications);
        this.poller = setInterval(this.fetchNotifications, 1000*30);
    },


    componentWillUnmount: function() {
        window.removeEventListener("focus", this.fetchNotifications);
        clearInterval(this.poller);
    },


    render: function() {
        var tickets = this.state.tickets;
        var count = "("+tickets.length+")";

        return (
            <DropdownButton title={"Ilmoitukset " + count}>
                {tickets.map(function(ticket) {
                    var comment = ticket.comments()[0];

                    var updateText = comment.createdBy().getFullName() +
                        " lisäsi kommentin tukipyyntöön \"" +
                        ticket.getCurrentTitle() + "\"";

                    return (
                        <MenuItem header>
                            <Link to="ticket" id={ticket.get("id")}>{updateText}</Link>
                        </MenuItem>
                    );
                })}
            </DropdownButton>
        );
    }
});

module.exports = NotificationsHub;