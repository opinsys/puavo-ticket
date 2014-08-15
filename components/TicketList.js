/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var Link = require("react-router").Link;
var Badge = require("react-bootstrap/Badge");
var Grid = require("react-bootstrap/Grid");
var Row = require("react-bootstrap/Row");
var Col = require("react-bootstrap/Row");

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


    render: function() {
        var title = this.props.title;
        var tickets = this.props.tickets;
        return <span className="TitleList">{title}</span>;
        return (
            <div className="TitleList">
                <h1>{title} <span className="numberOfTickets">({tickets.length})</span></h1>
                {tickets.map(function(ticket) {
                    var creator = ticket.createdBy();
                    return (
                        <div className="ticket-group">
                            <h2>{ticket.get("title")}</h2>

                            <p>
                                Aloittanut {creator.getFullName()} <Badge>{creator.getOrganisationDomain()}</Badge>
                            </p>

                            <div className="handlers">
                                {ticket.handlers().map(function(handler) {
                                    return <ProfileBadge tipPlacement="left" size={40} user={handler.getHandlerUser()} />;
                                })}
                            </div>

                            <TimeAgo date={ticket.updatedAt()} />
                        </div>
                    );
                })}
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
            <div className="TicketList">
                <Loading visible={this.state.fetching} />

                <Grid>
                    <Row>
                        <Col xs={6} md={4}>
                            <TitleList title="Odottavat tukipyynnöt" tickets={pending} user={this.props.user} />
                        </Col>
                        <Col xs={6} md={4}>
                            <TitleList title="Minun tukipyynnöt" tickets={myTickets} user={this.props.user} />
                        </Col>
                        <Col xs={6} md={4}>
                            <TitleList title="Käsitellyt tukipyynnöt" tickets={closed} user={this.props.user} />
                        </Col>
                    </Row>
                    <Row>
                        <Col xs={12} md={12}>
                            <TitleList title="Muiden tukipyynnöt" tickets={others} user={this.props.user} />
                        </Col>
                    </Row>
                </Grid>

            </div>
        );
    }
});

module.exports = TicketList;
