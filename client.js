/** @jsx React.DOM */
var React = require("react/addons");

var TicketForm = require("./components/TicketForm");
var TicketList = require("./components/TicketList");

var TicketModel = require("./TicketModel");

var Route = require("./react-route");
var routes = require("./components/routes");
var RouteNew = routes.RouteNew;
var RouteExisting = routes.RouteExisting;
var RouteTicketList = routes.RouteTicketList;
var LinkNewTicket = routes.LinkNewTicket;
var LinkTicketList = routes.LinkTicketList;


var Menu = React.createClass({
    render: function() {
        return (
            <ul className="link-menu">
                {[].concat(this.props.children).map(function(item) {
                    return <li>{item}</li>;
                })}
            </ul>
        );
    }
});

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
                    <Menu>
                        <LinkTicketList>Näytä olemassa olevat tukipyynnöt</LinkTicketList>
                    </Menu>
                    <TicketForm ticketModel={this.props.ticketModel} />
                </RouteNew>

                <RouteExisting>
                    <Menu>
                        <LinkNewTicket>Uusi tukipyyntö</LinkNewTicket>
                        <LinkTicketList>Näytä muut tukipyynnöt</LinkTicketList>
                    </Menu>
                    <TicketForm ticketModel={this.props.ticketModel} />
                </RouteExisting>

                <RouteTicketList>
                    <Menu>
                        <LinkNewTicket>Uusi tukipyyntö</LinkNewTicket>
                    </Menu>
                    <TicketList />
                </RouteTicketList>

            </div>
        );
    }

});

var _ticketModel = new TicketModel();

React.renderComponent(<Main ticketModel={_ticketModel} />, document.getElementById("app"));
