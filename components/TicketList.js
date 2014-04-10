/** @jsx React.DOM */
"use strict";
var React = require("react/addons");

var routes = require("./routes");
var LinkTicket = routes.LinkTicket;
var TicketModel = require("../TicketModel");

var organisations = [
    "kuokkala",
    "kortepohja",
    "palokka",
    "pupuhuhta",
    "viitaniemi"
];

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
                                <b> {organisations[Math.round(Math.random()*organisations.length)]}</b>
                            </li>
                        );
                    })}
                </ul>
                <h2>Päivittyneet tukipyynnöt</h2>

                <p>
                    <i>todo: lista tukipyynnöistä jotka ovat osoitettu sinulle</i>
                </p>

                <p>
                    <a href="#">Muut tukipyynnöt</a>
                </p>
            </div>
        );
    }
});

module.exports = TicketList;
