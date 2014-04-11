/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var Route = require("./react-route");
Route.root = "/foo";

var TicketForm = require("./components/TicketForm");
// var TicketList = require("./components/TicketList");

// var TicketModel = require("./TicketModel");

var Ticket = require("./models/client/Ticket");

var routes = require("./components/routes");
var LinkNewTicket = routes.LinkNewTicket;
var LinkTicket = routes.LinkTicket;

var ListenToMixin = require("./ListenToMixin");

var $ = require("jquery");
var Backbone = require("backbone");
Backbone.$ = $;

var TicketList = React.createClass({

    mixins: [ListenToMixin],

    getInitialState: function() {
        return {
            ticketCollection: Ticket.collection(),
        };
    },

    componentDidMount: function() {
        var self = this;

        this.listenTo(
            this.state.ticketCollection, "all", function(e) {
                console.log("collection update", e, !!self.state.ticketCollection.fetching);
                self.forceUpdate();
        });

        this.state.ticketCollection.fetch();

    },

    render: function() {
        console.log("render list", Date.now(), !! this.state.ticketCollection.fetching);
        return (
            <div>
                <h2>Päivittyneet tukipyynnöt</h2>
                {this.state.ticketCollection.fetching && <p>Ladataan...</p>}
                <ul>
                    {this.state.ticketCollection.map(function(ticket) {
                        return (
                            <li key={ticket.get("id")}>
                                <LinkTicket id={ticket.get("id")}>
                                {ticket.get("title")}
                                </LinkTicket>
                            </li>
                        );
                    })}
                </ul>
                <LinkNewTicket>Uusi</LinkNewTicket>
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
 * @uses utils.ListenToMixin
 */
var Main = React.createClass({

    mixins: [Route.Mixin, ListenToMixin],

    /**
     * @method renderTicketForm
     */
    renderTicketForm: function() {
        if (routes.newTicket.match || routes.existingTicket.match) {
            return <TicketForm />;
        }
    },

    render: function() {
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
