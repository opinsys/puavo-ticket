/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var _ = require("lodash");

var Ticket = require("../models/client/Ticket");
var navigation = require("./navigation");
var TicketViewLink = navigation.link.TicketViewLink;

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
	// TODO error checks etc.
	var ticketCreator = "", firstname = ticket.get("handlers")[0]["handler"]["external_data"]["first_name"], lastname = ticket.get("handlers")[0]["handler"]["external_data"]["last_name"];
	ticketCreator = firstname + " " + lastname;
	console.log(ticket.get("handlers")[0]["handler"]["external_data"]);
	return(
	    <span className="ticket-creator">
		 - {ticketCreator}
	    </span>
	);
    },


    render: function() {
        var self = this;
        return (
            <div className="ticketlist">
                <ul ref="list">
                    {this.props.tickets.map(function(ticket) {
                        return (
                                <li key={ticket.get("id")} className={ self.getTitleClass(ticket, self.props.user.get("id")) }>
				<span>
                                <TicketViewLink
                                    id={ticket.get("id")}
                                    onClick={self.props.onSelect.bind(null, ticket)} >
                                {"#" + ticket.get("id") + " " + ticket.get("title")}
                                </TicketViewLink>
                            	</span>
				 {self.renderTicketMetaInfo(ticket)}
				</li>
                        );
                    })}
                </ul>
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


    getInitialState: function() {
        return {
            ticketCollection: Ticket.collection(),
        };
    },

    componentDidMount: function() {
        this.state.ticketCollection.fetch();
    },

    render: function() {
        var handledByCurrentUser = this.state.ticketCollection
          .filter(isOpen)
          .filter(isHandledBy.bind(null, this.props.user));

        return (
            <div className="ticket-wrap row">
                {/* <p>ticket count: {this.state.ticketCollection.size()}</p> */}
                
                <div className="ticket-division col-md-4">
                    {this.state.ticketCollection.fetching && <p>Ladataan...</p>}
                    {handledByCurrentUser.length > 0 && <div>
                    <div className="header">
			<h3>Avoimet tukipyynnöt</h3>
			<p className="numberOfTickets">{handledByCurrentUser.length}</p>
		    </div>
                        <List user={this.props.user}
                            onSelect={this.props.onSelect}
                            tickets={handledByCurrentUser} />
                    </div>}
                </div>
                <div className="ticket-division col-md-4">

                    <div className="header">
			<h3>Käsittelyssä olevat tukipyynnöt</h3>
            	        <p className="numberOfTickets">{this.state.ticketCollection.filter(isOpen).filter(notIn.bind(null, handledByCurrentUser)).length}</p>
		    </div>
                    <List onSelect={this.props.onSelect}
                        user={this.props.user}
                        tickets={this.state.ticketCollection
                        .filter(isOpen)
                        .filter(notIn.bind(null, handledByCurrentUser))} />
                </div>
                <div className="ticket-division col-md-4">
                    <div className="header">
			<h3>Ratkaistut tukipyynnöt</h3>
               	        <p className="numberOfTickets">{this.state.ticketCollection.filter(isClosed).length}</p>
		    </div>
                    <List onSelect={this.props.onSelect}
                        user={this.props.user}
                        tickets={this.state.ticketCollection.filter(isClosed)} />
                </div>
            </div>
        );
    }
});

module.exports = TicketList;
