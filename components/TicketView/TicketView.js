/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var Link = require("react-router").Link;

var app = require("app");
var Ticket = require("app/models/client/Ticket");
var BackboneMixin = require("app/components/BackboneMixin");
var captureError = require("../../utils/captureError");

/**
 * TicketView
 *
 * @namespace components
 * @class TicketView
 * @constructor
 * @param {Object} props
 * @param {Socket.IO} props.io Socket.IO socket
 * @param {BrowserTitle} props.title BrowserTitle instance
 */
var TicketView = React.createClass({

    mixins: [BackboneMixin],

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
        this.fetchTicket();
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
        var user = app.currentUser;
        var ticket = this.state.ticket;
        var canSeeActionTabs = user.acl.canEditHandlers() || user.acl.canEditTags();

        return (
            <div className="TicketView">

                {canSeeActionTabs && <ul className="nav nav-tabs" role="tablist">

                    <li>
                        <Link to="discuss" params={{ id: ticketId }}>
                            Keskustelu
                        </Link>
                    </li>

                    {user.acl.canEditHandlers() && <li>
                        <Link to="handlers" params={{ id: ticketId }}>
                            Käsittelijät
                        </Link>
                    </li>}

                    {user.acl.canEditTags() && <li>
                        <Link to="tags" params={{ id: ticketId }}>
                            Tagit
                        </Link>
                    </li>}

                </ul>}

                {ticket.hasData() &&
                    <this.props.activeRouteHandler ticket={ticket} />}
            </div>
        );
    },

});

module.exports = TicketView;
