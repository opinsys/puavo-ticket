"use strict";
var React = require("react/addons");
var Link = require("react-router").Link;
var s = require("underscore.string");

var app = require("../index");
var StatusBadge = require("../components/StatusBadge");
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
        var status = ticket.getCurrentStatus();
        var ticketId = ticket.get("id");
        var title = ticket.getCurrentTitle();
        var handlers = ticket.rel("handlers").map(h => h.getUser());
        var user = app.currentUser;

        var comment = ticket.rel("comments").last();


        return (
            <div className="TicketList-item" >
                <div className="TicketList-handlers" >
                    {handlers.map((handler) => {
                        return <Profile.Overlay key={handler.get("id")} clickForDetails user={handler} tipPlacement="left">
                            <Profile.Badge user={handler} size={30} />
                        </Profile.Overlay>;
                    })}
                </div>
                <div className="TicketList-header">
                    <StatusBadge status={status} />
                    <span className="TicketList-created-at">
                        Lähettänyt <Profile.Overlay user={ticket.createdBy()} clickForDetails>{ticket.createdBy().getFullName()}</Profile.Overlay> <TimeAgo date={ticket.createdAt()} />
                    </span>
                </div>
                <h2>
                    <Link to="ticket" className="TicketList-link" params={{id: ticketId}}>
                        {user.acl.canSeeTicketDetails() &&
                        <span className="TicketList-ticket-id">#{ticketId} </span>}
                        <span className="TicketList-ticket-title">{title}</span>
                    </Link>
                </h2>
                <div className="TicketList-footer">
                    {comment &&
                    <div className="TicketList-comment">
                        Viimeisin kommentti: <span className="TicketList-comment-content">
                            {s.prune(comment.get("comment"), 100)}
                        </span>
                        <span className="TicketList-commenter"> -
                            <Profile.Overlay clickForDetails user={comment.createdBy()} tipPlacement="left" >
                                {comment.createdBy().getFullName()}
                            </Profile.Overlay>
                        </span> <TimeAgo className="TicketList-comment-time" date={comment.createdAt()} />
                    </div>}
                </div>
            </div>
        );
    },


    render: function() {
        var tickets = this.props.tickets;

        if (tickets.length === 0) {
            return <div className="TicketList TicketList-empty">
                Ei tukipyyntöjä
            </div>;
        }

        return (
            <ul className="TicketList">
                {tickets.map((ticket) => {
                    return <li key={ticket.get("id")}>{this.renderTicketMetaInfo(ticket)}</li>;
                })}
            </ul>
        );
    }
});


module.exports = TicketList;
