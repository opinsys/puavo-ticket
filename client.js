/** @jsx React.DOM */
var React = require("react/addons");
var Route = require("./react-route");
Route.root = "/foo";

var TicketForm = require("./components/TicketForm");
// var TicketList = require("./components/TicketList");

// var TicketModel = require("./TicketModel");

var Ticket = require("./models/client/Ticket");

var routes = require("./components/routes");
var RouteNew = routes.RouteNew;
var RouteExisting = routes.RouteExisting;
var RouteTicketList = routes.RouteTicketList;
var LinkNewTicket = routes.LinkNewTicket;
var LinkTicketList = routes.LinkTicketList;


var $ = require("jquery");
var Backbone = require("backbone");
Backbone.$ = $;


var Main = React.createClass({

    mixins: [Route.Mixin],

    getInitialState: function() {
        return {
            ticketModel: new Ticket()
        };
    },

    componentDidMount: function() {
        console.log("binding model");
        var self = this;
        this.state.ticketModel.on("change save:done fetch:done", function() {
            self.forceUpdate();
        });
    },

    render: function() {
        return (
            <div className="main">

                <h1>Tukipalvelu</h1>

                <TicketForm ticketModel={this.state.ticketModel} />

            </div>
        );
    }

});


React.renderComponent(<Main />, document.getElementById("app"));
