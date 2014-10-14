/** @jsx React.DOM */
"use strict";

var React = require("react/addons");
var OverlayTrigger = require("react-bootstrap/OverlayTrigger");
var Tooltip = require("react-bootstrap/Tooltip");

var User = require("app/models/client/User");
/**
 * @namespace components
 * @class ProfileOverlay
 * @constructor
 * @param {Object} props
 * @param {models.client.User} props.user
 * @param {String} [props.tipPlacement=right]
 */
var ProfileOverlay = React.createClass({

    propTypes: {
        user: React.PropTypes.instanceOf(User).isRequired,
        tipPlacement: React.PropTypes.string
    },

    renderTooltip: function() {
        var user = this.props.user;
        return (
            <span>
                {user.getOrganisationName()}
                <br />
                {user.getFullName()} ({user.get("id")})
                <br />
                {user.getEmail()}
                {!user.isEmailOnly() && <div>
                    <b>Puavo:</b> {user.getDomainUsername()} ({user.getExternalId()})
                </div>}
            </span>
        );
    },

    render: function() {
        var children = this.props.children;

        if (typeof children === "string") {
            children = <span>{children}</span>;
        }


        return (
            <OverlayTrigger
                placement={this.props.tipPlacement}
                overlay={<Tooltip>{this.renderTooltip()}</Tooltip>}>{children}</OverlayTrigger>
        );
    }
});

module.exports = ProfileOverlay;
