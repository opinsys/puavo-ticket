/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var Link = require("react-router").Link;

var Ticket = require("app/models/client/Ticket");
var BackboneMixin = require("app/components/BackboneMixin");
var User = require("app/models/client/User");
var captureError = require("../../utils/captureError");

/**
 * TicketView
 *
 * @namespace components
 * @class TicketView
 * @constructor
 * @param {Object} props
 * @param {models.client.User} props.user
 * @param {Socket.IO} props.io Socket.IO socket
 * @param {Function} props.renderInModal
 * @param {BrowserTitle} props.title BrowserTitle instance
 */
var TicketView = React.createClass({

    mixins: [BackboneMixin],

    propTypes: {
        user: React.PropTypes.instanceOf(User).isRequired,
    },

    createInitialState: function(props) {
        return {
            ticket: new Ticket({ id: props.params.id }),
        };
    },

    getInitialState: function() {
        return this.createInitialState(this.props);
    },

    componentWillReceiveProps: function(nextProps) {
        if (this.props.params.id !== nextProps.params.id) {
            console.log("TicketView ticket fetch from componentWillReceiveProps");
            this.setBackbone(this.createInitialState(nextProps), this.fetchTicket);
            return;
        }
    },

    componentDidMount: function() {
        window.addEventListener("focus", this.fetchTicket);
    },

    componentWillUnmount: function() {
        window.removeEventListener("focus", this.fetchTicket);
    },

    fetchTicket: function() {
        this.state.ticket.fetch()
        .catch(captureError("tukipyynnön tilan päivitys epännistui"));
    },


    render: function() {
        var ticketId = this.props.params.id;
        var user = this.props.user;

        return (
            <div className="TicketView">

                {user.isManager() && false && <ul className="nav nav-tabs" role="tablist">
                    <li>
                        <Link to="ticket" params={{ id: ticketId }}>discuss</Link>
                    </li>
                    <li>
                        <Link to="tags" params={{ id: ticketId }}>tags</Link>
                    </li>
                </ul>}

                <this.props.activeRouteHandler
                    renderInModal={this.props.renderInModal}
                    user={this.props.user}
                    ticket={this.state.ticket} />
            </div>
        );
    },

});

module.exports = TicketView;
