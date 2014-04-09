/** @jsx React.DOM */
var React = require("react/addons");
var Route = require("./react-route");
Route.root = "/foo";

var TicketForm = require("./components/TicketForm");
// var TicketList = require("./components/TicketList");

// var TicketModel = require("./TicketModel");

var Ticket = require("./models/client/Ticket");

var routes = require("./components/routes");
var ListenToMixin = require("./ListenToMixin");

var $ = require("jquery");
var Backbone = require("backbone");
Backbone.$ = $;


var TicketList = React.createClass({
    render: function() {
        return (
        );
    }
});


var Main = React.createClass({

    mixins: [Route.Mixin, ListenToMixin],

    getInitialState: function() {
        return {
            ticketModel: new Ticket()
        };
    },

    componentDidMount: function() {
        var self = this;
        this.listenTo(
            this.state.ticketModel,
            "change save:end fetch:end save:start fetch:start",
            function(e) {
                console.log("force update!", e);
                self.forceUpdate();
        });
    },

    renderTicketList: function() {

    },

    renderTicketForm: function() {
        if (routes.newTicket.match || routes.existingTicket.match) {
            return <TicketForm ticketModel={this.state.ticketModel} />;
        }
    },

    render: function() {
        return (
            <div className="main">

                <h1>Tukipalvelu</h1>

                {this.renderTicketForm()}


            </div>
        );
    }

});


React.renderComponent(<Main />, document.getElementById("app"));
