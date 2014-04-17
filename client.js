/** @jsx React.DOM */
"use strict";
require("./client_setup");

var React = require("react/addons");
var Route = require("./utils/react-route");

var TicketForm = require("./components/TicketForm");
var TicketList = require("./components/TicketList");

var routes = require("./components/routes");


/**
 * Root React component. The app starts here
 *
 * @namespace components
 * @class Main
 * @extends react.ReactComponent
 * @uses utils.Route.Mixin
 */
var Main = React.createClass({

    mixins: [Route.Mixin],

    /**
     * @method renderTicketForm
     */
    renderTicketForm: function() {
        if (routes.newTicket.match || routes.existingTicket.match) {
            return <TicketForm user={window.USER} />;
        }
    },

    render: function() {
        console.log("render Main");
        return (
            <div className="main">

                <h1>Tukipalvelu</h1>

                {routes.ticketList.match && <TicketList />}

                {this.renderTicketForm()}

            </div>
        );
    }

});

React.renderComponent(<Main />, document.getElementById("app"));
