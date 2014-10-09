/** @jsx React.DOM */
"use strict";
var React = require("react/addons");

var Ticket = require("../models/client/Ticket");
var User = require("../models/client/User");

var Loading = require("./Loading");
var captureError = require("../utils/captureError");
var TicketList = require("./TicketList");


/**
 * List existing tickets under multiple categories
 *
 * @namespace components
 * @class FrontPage
 * @extends React.ReactComponent
 * @constructor
 * @param {Object} props
 * @param {models.client.User} props.user
 * @param {models.client.Ticket.Collection} props.unreadTickets
 */
var FrontPage = React.createClass({

    propTypes: {
        user: React.PropTypes.instanceOf(User).isRequired,
        unreadTickets: React.PropTypes.instanceOf(Ticket.Collection).isRequired,
        ticketCollection: React.PropTypes.instanceOf(Ticket.Collection).isRequired
    },

    getInitialState: function() {
        return {
            fetching: true
        };
    },

    componentDidMount: function() {
        var self = this;
        self.props.ticketCollection.fetch()
        .then(function(coll) {
            if (self.isMounted()) self.setState({ fetching: false });
        })
        .catch(captureError("Tukipyyntö listauksen haku epäonnistui"));
    },

    render: function() {
        var unreadTickets = this.props.unreadTickets;
        var coll = this.props.ticketCollection;
        var pending = coll.selectPending();
        var myTickets = coll.selectHandledBy(this.props.user);
        var others = coll.selectHandledByOtherManagers(this.props.user);
        var closed = coll.selectClosed();

        return (
            <div className="FrontPage ticket-wrap row">
                <Loading visible={this.state.fetching} />
                <TicketList title="Odottavat tukipyynnöt" tickets={pending} unreadTickets={unreadTickets} user={this.props.user} />
                <TicketList title="Minun tukipyyntöni" tickets={myTickets} unreadTickets={unreadTickets} user={this.props.user} />
                {others.length > 0 &&
                    <TicketList title="Muiden tukipyynnöt" tickets={others} unreadTickets={unreadTickets} user={this.props.user} />}
                <TicketList title="Käsitellyt tukipyynnöt" tickets={closed} unreadTickets={unreadTickets} user={this.props.user} />
            </div>
        );
    }
});

module.exports = FrontPage;
