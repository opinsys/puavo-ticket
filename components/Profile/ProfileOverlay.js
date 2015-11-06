"use strict";

var React = require("react/addons");
var OverlayTrigger = require("react-bootstrap/lib/OverlayTrigger");
var Tooltip = require("react-bootstrap/lib/Tooltip");
var Modal = require("react-bootstrap/lib/Modal");

var User = require("../../models/client/User");
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

    getInitialState() {
        return {showModal: false};
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
        this.setState({showModal: true});
    },

    render: function() {
        var user = this.props.user;
        var children = this.props.children;

        if (this.props.display === "inline") {
            children = <span>{children}</span>;
        } else  {
            children = <div className="ProfileOverlay-children-wrap" >{children}</div>;
        }


        if (user.robot) return children;

        if (this.props.clickForDetails) {
            var className = children.props.className || "";
            className += " ProfileOverlay-details-click";
            children.props.className = className;
            children.props.onClick = this.handleOnClick;
        }

        return (
            <div>
                <Modal show={this.state.showModal} onHide={_ => this.setState({showModal: false})}>
                    <Modal.Header closeButton>
                        <Modal.Title>Käyttäjätiedot</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <ProfileDetails user={user} />
                    </Modal.Body>
                </Modal>

                <OverlayTrigger
                    placement={this.props.tipPlacement}
                    overlay={<Tooltip id="ProfileOverlay">{this.renderTooltip()}</Tooltip>}>{children}</OverlayTrigger>
            </div>
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
