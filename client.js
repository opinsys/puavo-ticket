/** @jsx React.DOM */
"use strict";
require("./client_setup");

var React = require("react/addons");
var Nav = require("./utils/Nav");

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
 */
var Main = React.createClass({

    mixins: [EventMixin],

    getInitialState: function() {
        return {
            user: this.createBoundEmitter(User, window.USER),
            ticket: this.createBoundEmitter(Ticket)
        };
    },

    componentWillMount: function() {
        this.onNavigate();
    },

    componentDidMount: function() {
        Nav.on("navigate", this.onNavigate);
    },

    componentWillUnmount: function() {
        Nav.off("navigate", this.onNavigate);
    },

    onNavigate: function() {
        var existing = routes.existingTicket;

        if (existing.isMatch() && existing.get("id") !== this.state.ticket.get("id")) {
            console.log("nav setting new ticket");
            this.setTicket(existing.get("id"));
            return;
        } else if (routes.newTicket.isMatch()) {
            console.log("nav setting empty ticket");
            this.setTicket();
        } else {
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
                    <button onClick={routes.LinkNewTicket.go} className="top-button" >Uusi</button>
                    <button onClick={routes.LinkTicketList.go} className="top-button" >Tukipyynnöt</button>

                    <UserInformation user={this.state.user} />
                </div>

                <div className="main-wrap">
                    <div className="main">

                        <h1>Tukipalvelu</h1>

                        {routes.ticketList.isMatch() && <TicketList />}
                        {routes.newTicket.isMatch() && <TicketForm ticket={this.state.ticket} />}
                        {routes.existingTicket.isMatch() && <TicketView ticket={this.state.ticket} />}

                    </div>
                </div>
            </div>
        );
    }

});


React.renderComponent(<Main />, document.getElementById("app"));
