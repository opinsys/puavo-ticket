/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var classSet = React.addons.classSet;
var Link = require("react-router").Link;
var Badge = require("react-bootstrap/Badge");

var Ticket = require("../models/client/Ticket");
var User = require("../models/client/User");

var ProfileBadge = require("./ProfileBadge");
var TimeAgo = require("./TimeAgo");


/**
 * List of tickets under a title
 *
 * @namespace components
 * @class TicketList
 * @constructor
 * @param {Object} props
 * @param {String} props.title Title for the list
 * @param {models.client.User} props.user The current user. Used to render
 * unread highlights
 * @param {Array} props.tickets Array of models.client.Ticket
 * @param {models.client.Ticket.Collection} props.unreadTickets
 */
var TicketList = React.createClass({

    propTypes: {
        title: React.PropTypes.string.isRequired,
        user: React.PropTypes.instanceOf(User).isRequired,
        tickets: React.PropTypes.array.isRequired,
        unreadTickets: React.PropTypes.instanceOf(Ticket.Collection).isRequired
    },

    renderTicketMetaInfo: function(ticket, read) {

        var className = classSet({
            unread: !read,
            read: read
        });

        var creator = ticket.createdBy();
        var handlers = ticket.handlers();

        return (
            <tr key={ticket.get("id")} className={className}>
                <td>#{ticket.get("id")}</td>
                <td>
                    <Link to="ticket" params={{ id: ticket.get("id")}}>
                        {ticket.getCurrentTitle()}

                        <Badge className="unread-comments" title="Uusia kommentteja">
                            <i className="fa fa-comment-o"></i>
                        </Badge>

                    </Link>
                </td>
                <td className="ticket-creator">
                    {creator.getFullName()}
                </td>
                <td className="ticket-updated">
                    <TimeAgo date={ticket.updatedAt()} />
                </td>
                <td className="ticket-handlers">
                    {handlers.map(function(handler) {
                        return <ProfileBadge tipPlacement="left" size={40} user={handler.getUser()} />;
                    })}
                </td>
            </tr>
        );
    },


    render: function() {
        var self = this;
        var tickets = this.props.tickets;
        var unreadTickets = this.props.unreadTickets;

        return (
            <div className="TicketList ticket-division col-md-12">
                <div className="header">
                    <h3>{this.props.title}</h3>
                    <span className="numberOfTickets">({tickets.length})</span>
                </div>

                <div className="ticketlist">
                    <table ref="list" className="table table-striped table-responsive">
                        <tbody>
                            <tr>
                                <th data-column-id="id">ID</th>
                                <th data-column-id="subject">Aihe</th>
                                <th data-column-id="creator">Lähettäjä</th>
                                <th data-column-id="updated">Viimeisin päivitys</th>
                                <th data-column-id="handlers">Käsittelijä(t)</th>
                            </tr>

                            {this.props.tickets.map(function(ticket) {
                                var read = !unreadTickets.get(ticket);
                                return self.renderTicketMetaInfo(ticket, read);
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

        );
    }
});


module.exports = TicketList;
