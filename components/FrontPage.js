/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var Link = require("react-router").Link;

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
 * @param {models.client.Ticket.Collection} props.userTickets
 */
var FrontPage = React.createClass({

    propTypes: {
        user: React.PropTypes.instanceOf(User).isRequired,
        userTickets: React.PropTypes.instanceOf(Ticket.Collection).isRequired,
    },

    getInitialState: function() {
        return {
            fetching: true
        };
    },

    componentDidMount: function() {
        var self = this;
        self.props.userTickets.fetch()
        .then(function(coll) {
            if (self.isMounted()) self.setState({ fetching: false });
        })
        .catch(captureError("Tukipyyntö listauksen haku epäonnistui"));
    },

    render: function() {
        var userTickets = this.props.userTickets.toArray();
        var user = this.props.user;
        return (
            <div className="FrontPage ticket-wrap row">
                <Loading visible={this.state.fetching} />
                <TicketList title="Avoimet tukipyynöt joita seuraat" tickets={userTickets} user={this.props.user} />
                <Link to="solved-tickets">
                    Näytä ratkaistut tukipyyntösi
                </Link>
                {user.isManager() && <p>
                    <Link to="custom-list">
                        Mukautetut listat
                    </Link>
                </p>}
            </div>
        );
    }
});

module.exports = FrontPage;
