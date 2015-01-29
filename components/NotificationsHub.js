/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var DropdownButton = require("react-bootstrap/DropdownButton");
var MenuItem = require("react-bootstrap/MenuItem");
var Link = require("react-router").Link;
var Reflux = require("reflux");

var Actions = require("../Actions");
var NotificationsStore = require("../stores/NotificationsStore");

/**
 * NotificationsHub
 *
 * @namespace components
 * @class NotificationsHub
 * @constructor
 * @param {Object} props
 */
var NotificationsHub = React.createClass({

    mixins: [Reflux.connect(NotificationsStore)],


    render: function() {
        var items = this.state.notifications.map(function(n) {
            var key = n.url + n.title;
            return <NotificationItem key={key} title={n.title} href={n.url} />;
        });
        var count = items.length;

        return (
            <DropdownButton {...this.props}
                className="NotificationsHub NotificationsHub-label"
                title={"Ilmoitukset " + count}>

                {count > 0 &&
                <a className="NotificationsHub-mark-all-as-read"
                    disabled={!!this.state.markingAllAsRead}
                    href="#"
                    onClick={Actions.notifications.markAllAsRead}>Merkitse kaikki luetuiksi</a>}

                {count === 0 &&
                <MenuItem header>
                    Ei lukemattomia ilmoituksia
                </MenuItem>}

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
 */
var NotificationItem = React.createClass({

    propTypes: {
        href: React.PropTypes.string.isRequired,
        title: React.PropTypes.string.isRequired
    },

    render: function() {
        return (
            <MenuItem header className="NotificationsHub-item">
                <Link to={this.props.href}>{this.props.title}</Link>
            </MenuItem>
        );
    }
});

module.exports = NotificationsHub;
