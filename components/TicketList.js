/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var _ = require("lodash");
var Link = require("react-router").Link;
var Loading = require("./Loading");

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
        // TODO error checks at least
        var ticketCreator, firstname = ticket.get("createdBy").externalData.first_name, lastname = ticket.get("createdBy").externalData.last_name, latestUpdate = ticket.get("updatedAt"), handlers = ticket.get("handlers"), options={weekday: "short", month: "numeric", day: "numeric", hour: "numeric", minute:"numeric"}, firstNames, lastNames;
        ticketCreator = firstname + " " + lastname;
        // TODO not sure if this is the best way to do this at all...
        firstNames = _.chain(handlers)
            .map(function(items){return items.handler.externalData;})
            .mapValues('first_name')
            .toArray()
            .value();
        lastNames = _.chain(handlers)
            .map(function(items){return items.handler.externalData;})
            .mapValues('last_name')
            .toArray()
            .value();

        return(
            <span>
            <td className="ticket-creator">
                {ticketCreator}
            </td>
            <td className="ticket-updated">
                <time dateTime={'"' + latestUpdate + '"'} />{" " + new Date(Date.parse(latestUpdate)).toLocaleString('fi', options)}
            </td>
            <td className="ticket-handlers">
                {
                    _.map(_.zipObject(firstNames, lastNames), function(item, key){
                        return key + " " + item;
                    })
                }
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
                                                <span className="badge unread-comments" title="Uusia kommentteja">
                                                    <i className="fa fa-comment-o"></i>
                                                </span>
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
            <div className="ticket-wrap row">
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
