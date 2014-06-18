/** @jsx React.DOM */
"use strict";

var React = require("react/addons");

var DropdownButton = require("react-bootstrap/DropdownButton");
var MenuItem = require("react-bootstrap/MenuItem");

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

    handleLogout: function() {
        window.location = LogoutLink.renderHref();
    },

    render: function() {
        return (
            <div className="UserInformation">
                <img src={this.props.user.getProfileImage()} />
                <DropdownButton bsSize="xsmall"  title={this.getFullname()}>

                    {/* TODO: redirect to puavo profile edit */}
                    <MenuItem onClick={alert.bind(null, "todo")}>
                        Muokkaa profiiliasi
                    </MenuItem>

                    <MenuItem onClick={this.handleLogout}>
                        Kirjaudu ulos
                    </MenuItem>

                </DropdownButton>
            </div>
        );
    }
});


module.exports = UserInformation;
