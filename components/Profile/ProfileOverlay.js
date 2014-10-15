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
            <span className="ProfileOverlay">
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

    render: function() {
        var children = this.props.children;

        if (typeof children === "string") {
            children = <span>{children}</span>;
        } else if (children.length > 1) {
            children = <div>{children}</div>;
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
