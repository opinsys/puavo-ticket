"use strict";
var React = require("react");

var User = require("../../models/client/User");
var Profile = require("../Profile");

/**
 * @namespace components
 * @class SpeechBubble
 * @constructor
 * @param {Object} props
 * @param {models.client.User} props.user
 */
var SpeechBubble = React.createClass({

    propTypes: {
        user: React.PropTypes.instanceOf(User).isRequired,
    },

    getDefaultProps: function() {
        return {
            className: "",
            title: "",
            toolbar: ""
        };
    },

    render: function() {
        var user = this.props.user;
        var title = this.props.title;
        return (
            <div className={"SpeechBubble " + this.props.className} id={this.props.id} key={this.props.key}>
                <Profile.Overlay clickForDetails user={user} display="block" >
                    <Profile.Badge user={user} />
                </Profile.Overlay>
                <div className="bubble">
                    <div className="title">
                        <span className="SpeechBubble-name">{user.getFullName()}</span>
                        <span className="subtitle">{title}</span>
                    </div>
                    <div className="SpeechBubble-toolbar">{this.props.toolbar}</div>
                    <div className="content">
                        {this.props.children}
                    </div>
                </div>
            </div>
        );
    }
});

module.exports = SpeechBubble;
