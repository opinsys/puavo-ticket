/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var Router = require("react-router");
var Reflux = require("reflux");
var Link = Router.Link;
var RouteHandler = Router.RouteHandler;

var app = require("../../index");
var TicketStore = require("../../stores/TicketStore");
var Tabs = require("../Tabs");
var BackboneMixin = require("../BackboneMixin");
var Loading = require("../Loading");

/**
 * TicketView
 *
 * @namespace components
 * @class TicketView
 * @constructor
 * @param {Object} props
 */
var TicketView = React.createClass({

    mixins: [BackboneMixin, Reflux.connect(TicketStore)],

    componentWillReceiveProps: function(nextProps) {
        TicketStore.Actions.changeTicket(nextProps.params.id);
    },

    componentDidMount: function() {
        window.addEventListener("focus", this.refresh);
        TicketStore.Actions.changeTicket(this.props.params.id);
    },

    componentWillUnmount: function() {
        window.removeEventListener("focus", this.refresh);
    },

    refresh: function() {
        TicketStore.Actions.refreshTicket();
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

                {this.state.loading &&
                <Loading />}


                {ticket.hasData() &&
                    <RouteHandler ticket={ticket} params={self.props.params} query={self.props.query} />}
            </div>
        );
    },

});

module.exports = TicketView;
