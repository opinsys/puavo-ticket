/** @jsx React.DOM */
"use strict";
require("./client_setup");

var React = require("react/addons");
var Nav = require("./utils/Nav");

var User = require("./models/client/User");
var Ticket = require("./models/client/Ticket");
var Base = require("./models/client/Base");

var TicketForm = require("./components/TicketForm");
var TicketView = require("./components/TicketView");
var TicketList = require("./components/TicketList");

var navigation = require("./components/navigation");
var route = navigation.route;

var LogoutLink = navigation.link.LogoutLink;
var RootLink = navigation.link.RootLink;
var NewTicketLink = navigation.link.NewTicketLink;
var TicketViewLink = navigation.link.TicketViewLink;


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

    getInitialState: function() {
        return {
            user: new User(window.USER)
        };
    },

    componentDidMount: function() {
        Nav.on("navigate", this.onNavigate);
        Base.on("all", this.onBackboneUpdate);
    },

    componentWillMount: function() {
        this.onNavigate();
    },

    onBackboneUpdate: function(eventName) {
        this.forceUpdate();
    },

    componentWillUnmount: function() {
        Nav.off("navigate", this.onNavigate);
        Base.off("all", this.onBackboneUpdate);
    },

    onNavigate: function() {
        var existing = route.ticket.existing;

        if (route.ticket.newForm.isMatch()) {
            this.setTicket(new Ticket());
            return;
        }

        if (existing.isMatch()) {
            this.setTicket(new Ticket({ id: existing.get("id") }));
            return;
        }

        this.forceUpdate();
    },

    setTicket: function(ticket) {
        if (typeof ticket.get !== "function") throw new Error("Bad ticket");

        if (this.state.ticket && !this.state.ticket.isSame(ticket)) {
            this.state.ticket.dispose();
        }

        if (ticket.get("id")) ticket.fetchAll();
        this.setState({ ticket: ticket });
    },

    handleSelectTicket: function(ticket) {
        this.setTicket(ticket);
        TicketViewLink.go({ id: ticket.get("id") });
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

                        {route.root.isMatch() && <TicketList onSelect={this.handleSelectTicket} />}
                        {route.ticket.newForm.isMatch() && <TicketForm onSaved={this.handleSelectTicket} ticket={this.state.ticket} />}
                        {route.ticket.existing.isMatch() && <TicketView ticket={this.state.ticket} />}

                    </div>
                </div>
            </div>
        );
    }

});


React.renderComponent(<Main />, document.getElementById("app"));
