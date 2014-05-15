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

var navigation = require("./components/navigation");
var route = navigation.route;

var LogoutLink = navigation.link.LogoutLink;
var RootLink = navigation.link.RootLink;
var NewTicketLink = navigation.link.NewTicketLink;


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
                        <LogoutLink pushState={false}>Kirjaudu ulos</LogoutLink>
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
        var existing = route.ticket.existing;

        if (existing.isMatch() && existing.get("id") !== this.state.ticket.get("id")) {
            console.log("nav setting new ticket");
            this.setTicket(existing.get("id"));
            return;
        } else if (route.ticket.newForm.isMatch()) {
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
                    <button onClick={NewTicketLink.go} className="top-button" >Uusi</button>
                    <button onClick={RootLink.go} className="top-button" >Tukipyynnöt</button>

                    <UserInformation user={this.state.user} />
                </div>

                <div className="main-wrap">
                    <div className="main">

                        <h1>Tukipalvelu</h1>

                        {route.root.isMatch() && <TicketList />}
                        {route.ticket.newForm.isMatch() && <TicketForm ticket={this.state.ticket} />}
                        {route.ticket.existing.isMatch() && <TicketView ticket={this.state.ticket} />}

                    </div>
                </div>
            </div>
        );
    }

});


React.renderComponent(<Main />, document.getElementById("app"));
