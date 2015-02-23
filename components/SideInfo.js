"use strict";
var React = require("react/addons");


/**
 * Edit form for a ticket
 *
 * @namespace components
 * @class SideInfo
 * @extends React.ReactComponent
 */
var SideInfo = React.createClass({

    render: function() {
        return (
            <div className="SideInfo">
                <div className="contact box">
                    <p>Kiireellisissä tapauksissa <br/> soita tukinumeroomme <strong>014-4591625</strong></p>
                </div>

                <div className="checklist box">
                    <p><strong>Ilmoita nämä asiat tukipyynnössä</strong></p>
                    <ul>
                        <li>tarkka kuvaus tuen tarpeesta</li>
                        <li>koskeeko yhtä vai useampaa laitetta/käyttäjää</li>
                        <li>laite</li>
                        <li>käyttäjätunnus</li>
                        <li>ajankohta</li>
                    </ul>
                </div>

                <div className="ticket-form">



                    {this.props.children}


                </div>
            </div>
        );
    },


});

module.exports = SideInfo;
