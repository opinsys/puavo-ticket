/** @jsx React.DOM */
var React = require("react/addons");

var TicketForm = require("./components/TicketForm");

var TicketModel = require("./TicketModel");

var Route = require("./react-route");
var routes = require("./components/routes");
var RouteNew = routes.RouteNew;
var RouteExisting = routes.RouteExisting;


var Main = React.createClass({

    mixins: [Route.Mixin],

    propTypes: {
        ticketModel: TicketModel.Type.isRequired
    },

    render: function() {
        return (
            <div className="main">
                <h1>Tukipalvelu</h1>
                <RouteNew>
                    <TicketForm ticketModel={this.props.ticketModel} />
                </RouteNew>

                <RouteExisting>
                    <TicketForm ticketModel={this.props.ticketModel} />
                </RouteExisting>

            </div>
        );
    }

});

var _ticketModel = new TicketModel();

React.renderComponent(<Main ticketModel={_ticketModel} />, document.getElementById("app"));
