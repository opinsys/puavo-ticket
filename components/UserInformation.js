/** @jsx React.DOM */
"use strict";

var React = require("react/addons");

var DropdownButton = require("react-bootstrap/DropdownButton");
var MenuItem = require("react-bootstrap/MenuItem");


/**
 * User information and logout
 *
 * @namespace components
 * @class UserInformation
 */
var UserInformation = React.createClass({

    getFullname: function() {
        return this.props.user.get("externalData").first_name + " " + this.props.user.get("externalData").last_name;
    },

    render: function() {
        var linkToProfile = "https://" + this.props.user.get("externalData").organisation_domain + "/users/profile/edit";
        var linkToLogout = window.location.origin + "/logout";

        return (
            <div className="UserInformation">
                <img src={this.props.user.getProfileImage()} />
                <DropdownButton bsSize="xsmall"  title={this.getFullname()}>

                    {/* TODO: redirect to puavo profile edit */}
                    <MenuItem>
                        <a href={linkToProfile} target="_blank">
                            <i className="fa fa-cog"></i> Muokkaa profiiliasi
                        </a>
                    </MenuItem>

                    <MenuItem>
                        <a href={linkToLogout}>
                            <i className="fa fa-sign-out"></i> Kirjaudu ulos
                        </a>
                    </MenuItem>

                </DropdownButton>
            </div>
        );
    }
});


module.exports = UserInformation;
