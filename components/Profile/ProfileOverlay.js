/** @jsx React.DOM */
"use strict";

var React = require("react/addons");
var OverlayTrigger = require("react-bootstrap/OverlayTrigger");
var Tooltip = require("react-bootstrap/Tooltip");

var app = require("app");
var User = require("app/models/client/User");
var ProfileDetails = require("./ProfileDetails");

/**
 * @namespace components
 * @class ProfileOverlay
 * @constructor
 * @param {Object} props
 * @param {models.client.User} props.user
 * @param {Boolean} props.clickForDetails Show user details modal on click
 * @param {String} [props.tipPlacement=right]
 */
var ProfileOverlay = React.createClass({

    propTypes: {
        clickForDetails: React.PropTypes.bool,
        user: React.PropTypes.instanceOf(User).isRequired,
        display: React.PropTypes.oneOf(["block", "inline"]),
        tipPlacement: React.PropTypes.string
    },

    getDefaultProps: function() {
        return { display: "inline" };
    },

    renderTooltip: function() {
        var user = this.props.user;
        return (
            <span className="ProfileOverlay-tooltip">
                {user.getOrganisationName()}
                <br />
                {user.getFullName()} {parens(user.get("id"))}
                <br />

                {user.getEmail()}
                {!user.getEmail() && <span className="missing-email">
                    Sähköposti puuttuu Puavosta!
                </span>}

                {!user.isEmailOnly() && <div>
                    <b>Puavo:</b> {user.getDomainUsername()} {parens(user.getExternalId())}
                </div>}
            </span>
        );
    },

    handleOnClick: function() {
        var user = this.props.user;
        app.renderInModal({
            title: "Käyttäjätiedot",
            allowClose: true
        }, function() {
            return <ProfileDetails user={user} />;
        });
    },

    render: function() {
        var user = this.props.user;
        var children = this.props.children;

        children = <div style={{display: this.props.display}}>{children}</div>;

        if (user.robot) return children;

        if (this.props.clickForDetails) {
            var className = children.props.className || "";
            className += " ProfileOverlay-details-click";
            children.props.className = className;
            children.props.onClick = this.handleOnClick;
        }

        return (
            <OverlayTrigger
                placement={this.props.tipPlacement}
                overlay={<Tooltip>{this.renderTooltip()}</Tooltip>}>{children}</OverlayTrigger>
        );
    }
});


/**
 * wrap content with parens if any
 */
function parens(content) {
    if (!content) return "";
    return "(" + content + ")";
}

module.exports = ProfileOverlay;
