/** @jsx React.DOM */
var React = require("react/addons");

var routes = require("./routes");
var LinkTicket = routes.LinkTicket;
var TicketModel = require("../TicketModel");

var TicketList = React.createClass({

    propTypes: {
        ticketModel: TicketModel.Type.isRequired
    },

    render: function() {
        return (
            <div>
                <h2>Osoittamattomat tukipyynnöt</h2>
                <ul>
                    {Object.keys(window.localStorage).filter(function(key) {
                        return (/^ticket-/).test(key);
                    }).map(function(key) {
                        var item = JSON.parse(window.localStorage[key]);
                        return (
                            <li>
                                <LinkTicket uid={item.uid}>{item.title}</LinkTicket>
                                <i> {item.updates && item.updates.length} lukematonta viestiä</i>
                            </li>
                        );
                    })}
                </ul>
                <h2>Päivittyneet tukipyynnöt</h2>
                <i>tulossa</i>
            </div>
        );
    }
});

module.exports = TicketList;
