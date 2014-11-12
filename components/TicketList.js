/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var Link = require("react-router").Link;

var Profile = require("./Profile");
var TimeAgo = require("./TimeAgo");


/**
 * List of tickets
 *
 * @namespace components
 * @class TicketList
 * @constructor
 * @param {Object} props
 * @param {Array} props.tickets Array of models.client.Ticket
 */
var TicketList = React.createClass({

    propTypes: {
        tickets: React.PropTypes.array.isRequired,
    },

    renderTicketMetaInfo: function(ticket) {
        var creator = ticket.createdBy();
        var handlers = ticket.rel("handlers").toArray();
        var ticketId = ticket.get("id");

        return (
            <tr key={ticketId} >
                <td>#{ticketId}</td>
                <td>
                    <Link to="ticket" params={{id: ticketId}}>
                        {ticket.getCurrentTitle()}
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
                        var user = handler.getUser();
                        return (
                            <Profile.Overlay clickForDetails tipPlacement="left" key={handler.get("id")} user={user}>
                                <Profile.Badge size={40} user={user} />
                            </Profile.Overlay>
                        );
                    })}
                </td>
            </tr>
        );
    },


    render: function() {
        var self = this;
        var tickets = this.props.tickets;

        return (
            <div className="TicketList ticket-division col-md-12">

                <div className="ticketlist">
                    <table ref="list" className="table table-striped table-responsive">
                        <tbody>
                            <tr key="title">
                                <th data-column-id="id">ID</th>
                                <th data-column-id="subject">Aihe</th>
                                <th data-column-id="creator">Lähettäjä</th>
                                <th data-column-id="updated">Viimeisin päivitys</th>
                                <th data-column-id="handlers">Käsittelijä(t)</th>
                            </tr>

                            {tickets.map(function(ticket) {
                                return self.renderTicketMetaInfo(ticket);
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

        );
    }
});


module.exports = TicketList;
