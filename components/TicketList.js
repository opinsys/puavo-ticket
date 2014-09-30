/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var classSet = React.addons.classSet;
var Link = require("react-router").Link;
var Badge = require("react-bootstrap/Badge");

var Ticket = require("../models/client/Ticket");
var User = require("../models/client/User");

var Loading = require("./Loading");
var ProfileBadge = require("./ProfileBadge");
var captureError = require("../utils/captureError");
var BackboneMixin = require("./BackboneMixin");
var TimeAgo = require("./TimeAgo");


/**
 * List of tickets under a title
 *
 * @namespace components
 * @class TicketList.TitleList
 * @constructor
 * @param {Object} props
 * @param {String} props.title Title for the list
 * @param {models.client.User} props.user The current user. Used to render
 * unread highlights
 * @param {Array} props.tickets Array of models.client.Ticket
 * @param {models.client.Ticket.Collection} props.unreadTickets
 */
var TitleList = React.createClass({

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
            <div className="ticket-division col-md-12">
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

/**
 * List existing tickets under multiple categories
 *
 * @namespace components
 * @class TicketList
 * @extends React.ReactComponent
 * @constructor
 * @param {Object} props
 * @param {models.client.User} props.user
 * @param {models.client.Ticket.Collection} props.unreadTickets
 */
var TicketList = React.createClass({

    propTypes: {
        user: React.PropTypes.instanceOf(User).isRequired,
        unreadTickets: React.PropTypes.instanceOf(Ticket.Collection).isRequired
    },

    mixins: [BackboneMixin],

    getInitialState: function() {
        return {
            ticketCollection: Ticket.collection(),
            fetching: true
        };
    },

    componentDidMount: function() {
        this.state.ticketCollection.fetch()
        .bind(this)
        .then(function() {
            if (this.isMounted()) this.setState({ fetching: false });
        })
        .catch(captureError("Tukipyyntö listauksen haku epäonnistui"));
    },

    render: function() {
        var unreadTickets = this.props.unreadTickets;
        var coll = this.state.ticketCollection;
        var pending = coll.selectPending();
        var myTickets = coll.selectHandledBy(this.props.user);
        var others = coll.selectHandledByOtherManagers(this.props.user);
        var closed = coll.selectClosed();

        return (
            <div className="TicketList ticket-wrap row">
                <Loading visible={this.state.fetching} />
                <TitleList title="Odottavat tukipyynnöt" tickets={pending} unreadTickets={unreadTickets} user={this.props.user} />
                <TitleList title="Minun tukipyyntöni" tickets={myTickets} unreadTickets={unreadTickets} user={this.props.user} />
                {others.length > 0 &&
                    <TitleList title="Muiden tukipyynnöt" tickets={others} unreadTickets={unreadTickets} user={this.props.user} />}
                <TitleList title="Käsitellyt tukipyynnöt" tickets={closed} unreadTickets={unreadTickets} user={this.props.user} />
            </div>
        );
    }
});

module.exports = TicketList;
