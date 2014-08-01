/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var _ = require("lodash");
var Link = require("react-router").Link;
var Loading = require("./Loading");

var captureError = require("puavo-ticket/utils/captureError");
var Ticket = require("../models/client/Ticket");
var BackboneMixin = require("./BackboneMixin");

function isClosed(ticket) {
    return ticket.getCurrentStatus() === "closed";
}

function isOpen(ticket) {
    return ticket.getCurrentStatus() === "open";
}

function isHandledBy(user, ticket) {
    return !!_.find(ticket.get("handlers"), function(handler) {
        return handler.handler.id === user.get("id");
    });
}

/**
 * Return true if the needle model is not in the haystack array
 *
 * @private
 * @method notIn
 * @param {Array} haystack Array of tickets
 * @param {Backbone.Modle} needle
 * @return {Boolean}
 */
function notIn(haystack, needle) {
    return !haystack.some(function(existing) {
        return existing.get("id") === needle.get("id");
    });
}

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
        return (
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
        var handledByCurrentUser = this.state.ticketCollection
          .filter(isOpen)
          .filter(isHandledBy.bind(null, this.props.user));

        return (
            <div className="ticket-wrap row">


                <div className="ticket-division col-md-12">
                    {handledByCurrentUser.length > 0 && <div>
                    <div className="header">
                        <h3>
                            Avoimet tukipyynnöt
                            {this.state.fetching && <Loading.Spinner />}
                        </h3>
                        <span className="numberOfTickets">({handledByCurrentUser.length})</span>
                    </div>
                        <List user={this.props.user}
                            tickets={handledByCurrentUser} />
                    </div>}
                </div>
                <div className="ticket-division col-md-12">

                    <div className="header">
                        <h3>Käsittelyssä olevat tukipyynnöt</h3>
                        <span className="numberOfTickets">({this.state.ticketCollection.filter(isOpen).filter(notIn.bind(null, handledByCurrentUser)).length})</span>
                    </div>
                    <List
                        user={this.props.user}
                        tickets={this.state.ticketCollection
                        .filter(isOpen)
                        .filter(notIn.bind(null, handledByCurrentUser))} />
                </div>
                <div className="ticket-division col-md-12">
                    <div className="header">
                        <h3>Ratkaistut tukipyynnöt</h3>
                        <span className="numberOfTickets">({this.state.ticketCollection.filter(isClosed).length})</span>
                    </div>
                    <List
                        user={this.props.user}
                        tickets={this.state.ticketCollection.filter(isClosed)} />
                </div>
            </div>
        );
    }
});

module.exports = TicketList;
