/** @jsx React.DOM */
"use strict";
require("./client_setup");

var React = require("react/addons");
var Route = require("./utils/react-route");

var User = require("./models/client/User");
var Ticket = require("./models/client/Ticket");

var TicketForm = require("./components/TicketForm");
var TicketView = require("./components/TicketView");
var TicketList = require("./components/TicketList");
var EventMixin = require("./utils/EventMixin");

var routes = require("./components/routes");
var LinkLogout = routes.LinkLogout;


/**
 * User information and logout
 *
 * @namespace components
 * @class UserInformation
 */
var UserInformation = React.createClass({
    render: function() {
        return (
            <div className="user">
                <ul>
                    <li>
                        {this.props.user.get("external_data").first_name} {this.props.user.get("external_data").last_name}
                    </li>
                    <li>
                        <img src={this.props.user.getProfileImage()} />
                    </li>
                    <li>
                        <LinkLogout pushState={false}>Kirjaudu ulos</LinkLogout>
                    </li>
                </ul>
            </div>
        );
    }
});


/**
 * Root React component. The app starts here
 *
 * @namespace components
 * @class Main
 * @extends react.ReactComponent
 * @uses utils.Route.Mixin
 */
var Main = React.createClass({

    mixins: [Route.Mixin, EventMixin],

    getInitialState: function() {
        return {
            user: this.createBoundEmitter(User, window.USER),
            ticket: this.createBoundEmitter(Ticket)
        };
    },

    componentWillMount: function() {
        this.onNavigate();
    },

    onNavigate: function() {
        var existing = routes.existingTicket.match;

        if (existing && existing.params.id !== this.state.ticket.get("id")) {
            console.log("nav setting new ticket", existing.params.id);
            this.setTicket(existing.params.id);
            return;
        } else if (routes.newTicket.match) {
            console.log("nav setting empty ticket");
            this.setTicket();
        } else {
            console.log("nav just render");
            this.forceUpdate();
        }

    },

    setTicket: function(id) {
        if (this.state.ticket) this.state.ticket.off();
        this.setState({
            ticket: this.createBoundEmitter(Ticket, { id : id })
        });
    },


    render: function() {
        return (
            <div>
                <div className="topmenu">
                    <button onClick={routes.LinkNewTicket.navigate} className="top-button" >Uusi</button>
                    <button onClick={routes.LinkTicketList.navigate} className="top-button" >Tukipyynnöt</button>

                    <UserInformation user={this.state.user} />
                </div>

                <div className="main-wrap">
                    <div className="main">

                        <h1>Tukipalvelu</h1>

                        {routes.ticketList.match && <TicketList />}
                        {routes.newTicket.match && <TicketForm ticket={this.state.ticket} />}
                        {routes.existingTicket.match && <TicketView ticket={this.state.ticket} />}

                    </div>
                </div>
            </div>
        );
    }

});

React.renderComponent(<Main />, document.getElementById("app"));
