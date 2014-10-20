/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var Link = require("react-router").Link;

var captureError = require("app/utils/captureError");
var BackboneMixin = require("./BackboneMixin");
var TicketList = require("./TicketList");
var User = require("app/models/client/User");
var Ticket = require("app/models/client/Ticket");

/**
 *
 * @namespace components
 * @class Solved
 * @constructor
 * @param {Object} props
 */
var Solved = React.createClass({

    mixins: [BackboneMixin],

    propTypes: {
        user: React.PropTypes.instanceOf(User).isRequired,
    },

    getInitialState: function() {
        return {
            tickets: Ticket.collection([], {
                query: {
                    follower: this.props.user.get("id"),
                    tags: [
                        "status:closed"
                    ]
                }
            }),
        };
    },

    componentWillMount: function() {
        this.state.tickets.fetch()
        .catch(captureError("Ratkaistujen tukipyyntöjen haku epäonnistui"));
    },

    render: function() {
        var user = this.props.user;
        var tickets = this.state.tickets.toArray();
        return (
            <div className="Solved">
                <TicketList title="Käsitellyt tukipyynnöt" user={user} tickets={tickets} />
                <Link to="tickets">
                    Näytä avoimet tukipyyntösi
                </Link>
            </div>
        );
    }
});

module.exports = Solved;
