/** @jsx React.DOM */
"use strict";
require("./client_setup");

var React = require("react/addons");
var Route = require("./utils/react-route");

var User = require("./models/client/User");

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

    /**
     * @method renderTicketForm
     */
    renderTicketForm: function() {
        if (routes.newTicket.match || routes.existingTicket.match) {
            return <TicketForm user={this.state.user} />;
        }
    },

    getInitialState: function() {
        return {
            user: new User(window.USER)
        };
    },

    componentDidMount: function() {
        this.reactTo(this.state.user);
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
                        {routes.newTicket.match && <TicketForm />}
                        {routes.existingTicket.match &&
                            <TicketView ticketId={routes.existingTicket.match.params.id} />}

                    </div>
                </div>
            </div>
        );
    }

});

React.renderComponent(<Main />, document.getElementById("app"));
