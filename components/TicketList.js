/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var Link = require("react-router").Link;
var Badge = require("react-bootstrap/Badge");

var Loading = require("./Loading");
var ProfileBadge = require("./ProfileBadge");

var captureError = require("puavo-ticket/utils/captureError");
var Ticket = require("../models/client/Ticket");
var BackboneMixin = require("./BackboneMixin");


var List = React.createClass({

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
                {creator.getFullname()}
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
 * List existing tickes
 *
 * @namespace components
 * @class TicketList
 * @extends React.ReactComponent
 */
var TicketList = React.createClass({

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
                <List title="Odottavat tukipyynnöt" tickets={pending} user={this.props.user} />
                <List title="Minun tukipyynnöt" tickets={myTickets} user={this.props.user} />
                <List title="Muiden tukipyynnöt" tickets={others} user={this.props.user} />
                <List title="Käsitellyt tukipyynnöt" tickets={closed} user={this.props.user} />
            </div>
        );
    }
});

module.exports = TicketList;
