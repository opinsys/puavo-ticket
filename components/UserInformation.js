/** @jsx React.DOM */
"use strict";

var React = require("react/addons");

var DropdownButton = require("react-bootstrap/DropdownButton");
var MenuItem = require("react-bootstrap/MenuItem");

var Profile = require("./Profile");
var User = require("app/models/client/User");

/**
 * User information and logout
 *
 * @namespace components
 * @class UserInformation
 * @constructor
 * @param {Object} props
 * @param {models.client.User} props.user
 */
var UserInformation = React.createClass({

    propTypes: {
        user: React.PropTypes.instanceOf(User).isRequired,
    },


    render: function() {
        var linkToProfile = "https://" + this.props.user.get("externalData").organisation_domain + "/users/profile/edit";
        var linkToLogout = window.location.origin + "/logout";


        return (
            <div className="UserInformation">

                <Profile.Overlay user={this.props.user} tipPlacement="left" >
                    <Profile.Badge user={this.props.user} size={40} />
                </Profile.Overlay>

                <DropdownButton className="menu" bsSize="xsmall"  title={this.props.user.getFullName()} pullRight>

                    {/* TODO: redirect to puavo profile edit */}
                    <MenuItem header>
                        <a href={linkToProfile} target="_blank">
                            <i className="fa fa-cog"></i> Muokkaa profiiliasi
                        </a>
                    </MenuItem>

                    <MenuItem header>
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
