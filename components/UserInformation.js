/** @jsx React.DOM */
"use strict";

var React = require("react/addons");

var navigation = require("./navigation");
var LogoutLink = navigation.link.LogoutLink;

/**
 * User information and logout
 *
 * @namespace components
 * @class UserInformation
 */
var UserInformation = React.createClass({

    getFullname: function() {
        return this.props.user.get("external_data").first_name + " " + this.props.user.get("external_data").last_name;
    },

    render: function() {
        return (
            <div className="UserInformation">
                <img src={this.props.user.getProfileImage()} />
                <ul>
                    <li>{this.getFullname()}</li>
                    <li><LogoutLink pushState={false}>Kirjaudu ulos</LogoutLink></li>
                </ul>
            </div>
        );
    }
});


module.exports = UserInformation;
