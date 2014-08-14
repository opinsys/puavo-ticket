/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var Link = require("react-router").Link;
var Badge = require("react-bootstrap/Badge");

var Loading = require("./Loading");
var ProfileBadge = require("./ProfileBadge");
var captureError = require("../utils/captureError");
var Ticket = require("../models/client/Ticket");
var BackboneMixin = require("./BackboneMixin");
var User = require("../models/client/User");


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
 */
var TitleList = React.createClass({

    propTypes: {
        title: React.PropTypes.string.isRequired,
        user: React.PropTypes.instanceOf(User).isRequired,
        tickets: React.PropTypes.array.isRequired
    },

    getTitleClass: function(ticket, userId) {
        if (ticket.hasRead( userId )) {
            return "read";
        }
        return "unread";
    },

    renderTicketMetaInfo: function(ticket) {

        var creator = ticket.createdBy();
        var lastUpdate = ticket.get("updatedAt");
        var handlers = ticket.handlers();

        var options = {
            weekday: "short",
            month: "long",
            day: "numeric"
        };

        return(
            <span>
            <td className="ticket-creator">
                {creator.getFullName()}
            </td>
            <td className="ticket-updated">
                <time dateTime={'"' + lastUpdate + '"'} />{" " + new Date(Date.parse(lastUpdate)).toLocaleString('fi', options)}
            </td>
            <td className="ticket-handlers">
                {handlers.map(function(handler) {
                    return <ProfileBadge tipPlacement="left" size={40} user={handler.getHandlerUser()} />;
                })}
            </td>
            </span>
        );
    },


    render: function() {
        var self = this;
        var tickets = this.props.tickets;
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
                                return (
                                    <tr key={ticket.get("id")} className={ self.getTitleClass(ticket, self.props.user.get("id")) }>
                                        <td>#{ticket.get("id")}</td>
                                        <td>
                                            <Link to="ticket" id={ticket.get("id")}>
                                                {ticket.getCurrentTitle()}

                                                <Badge className="unread-comments" title="Uusia kommentteja">
                                                    <i className="fa fa-comment-o"></i>
                                                </Badge>

                                            </Link>
                                        </td>
                                         {self.renderTicketMetaInfo(ticket)}
                                    </tr>
                                );
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
 */
var TicketList = React.createClass({

    propTypes: {
        user: React.PropTypes.instanceOf(User).isRequired,
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
        var coll = this.state.ticketCollection;
        var pending = coll.selectPending();
        var myTickets = coll.selectHandledBy(this.props.user);
        var others = coll.selectHandledByOtherManagers(this.props.user);
        var closed = coll.selectClosed();

        return (
            <div className="TicketList ticket-wrap row">
                <Loading visible={this.state.fetching} />
                <TitleList title="Odottavat tukipyynnöt" tickets={pending} user={this.props.user} />
                <TitleList title="Minun tukipyynnöt" tickets={myTickets} user={this.props.user} />
                <TitleList title="Muiden tukipyynnöt" tickets={others} user={this.props.user} />
                <TitleList title="Käsitellyt tukipyynnöt" tickets={closed} user={this.props.user} />
            </div>
        );
    }
});

module.exports = TicketList;
