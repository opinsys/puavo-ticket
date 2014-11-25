/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var Router = require("react-router");
var Link = Router.Link;
var RouteHandler = Router.RouteHandler;

var app = require("app");
var Ticket = require("app/models/client/Ticket");
var Tabs = require("app/components/Tabs");
var BackboneMixin = require("app/components/BackboneMixin");
var captureError = require("../../utils/captureError");

/**
 * TicketView
 *
 * @namespace components
 * @class TicketView
 * @constructor
 * @param {Object} props
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
        var self = this;
        var ticketId = this.props.params.id;
        var user = app.currentUser;
        var ticket = this.state.ticket;
        var canSeeActionTabs = user.acl.canEditHandlers() || user.acl.canEditTags();

        return (
            <div className="TicketView">

                {canSeeActionTabs && <Tabs>

                    <li>
                        <Link className="TicketView-tab-discuss" to="discuss" params={{ id: ticketId }}>
                            Keskustelu
                        </Link>
                    </li>

                    {user.acl.canEditHandlers() && <li>
                        <Link className="TicketView-tab-handlers" to="handlers" params={{ id: ticketId }}>
                            Käsittelijät
                        </Link>
                    </li>}

                    {user.acl.canEditTags() && <li>
                        <Link to="tags" params={{ id: ticketId }}>
                            Tagit
                        </Link>
                    </li>}

                </Tabs>}

                {ticket.hasData() &&
                    <RouteHandler ticket={ticket} params={self.props.params} query={self.props.query} />}
            </div>
        );
    },

});

module.exports = TicketView;
