/** @jsx React.DOM */
"use strict";
require("./client_setup");

var React = require("react/addons");
var Route = require("./utils/react-route");

var User = require("./models/client/User");

var TicketForm = require("./components/TicketForm");
var TicketList = require("./components/TicketList");
var EventMixin = require("./utils/EventMixin");

var routes = require("./components/routes");


/**
 * Logout
 *
 * @namespace components
 * @class Logout
 */
var Logout = React.createClass({
    render: function() {
        return (
            <form className="logout" method="post" action="/logout">
                <input className="button" type="submit" value="Kirjaudu Ulos" />
            </form>
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
                    <button onClick={routes.LinkNewTicket.navigate} className="button" >Uusi</button>
                    <button onClick={routes.LinkTicketList.navigate} className="button" >Tukipyynnöt</button>

                    <div className="user">
                        <div className="user-link">
                            {this.state.user.get("first_name")} {this.state.user.get("last_name")}
                        </div>
                        <Logout />
                    </div>
                </div>

                <div className="main-wrap">
                    <div className="main">

                        <h1>Tukipalvelu</h1>

                        {routes.ticketList.match && <TicketList />}

                        {this.renderTicketForm()}
                    </div>
                </div>
            </div>
        );
    }

});

React.renderComponent(<Main />, document.getElementById("app"));
