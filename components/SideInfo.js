/** @jsx React.DOM */
"use strict";
var React = require("react/addons");



/**
 * Edit form for a ticket
 *
 * @namespace components
 * @class TicketForm
 * @extends React.ReactComponent
 */
var TicketForm = React.createClass({

    render: function() {
        return (
            <div>
            <div className="contact">
                <p>Kiireellisissä tapauksissa soita tukinumeroomme <b>014-4591625</b></p>
            </div>
                        
            <div className="checklist">
                <h2>Muistathan ilmoittaa nämä asiat tukipyyntöä tehdessä</h2>
                <ul>
                    <li>tarkka kuvaus tuen tarpeesta</li>
                    <li>laite</li>
                    <li>käyttäjätunnus</li>
                    <li>ajankohta</li>
                    <li>koskeeko yhtä vai useampaa laitetta/käyttäjää</li>
                </ul>
            </div>
        
            <div className="ticket-form">



                {this.props.children}


            </div>
            </div>
        );
    },


});

module.exports = TicketForm;
