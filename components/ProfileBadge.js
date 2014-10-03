/** @jsx React.DOM */
"use strict";

var React = require("react/addons");
var OverlayTrigger = require("react-bootstrap/OverlayTrigger");
var Tooltip = require("react-bootstrap/Tooltip");

var User = require("app/models/client/User");

/**
 * Display profile image in badge which is constrained by maxWidth and
 * maxHeight props. Profile is resized to fit into it while keeping the correct
 * aspect ratio.
 *
 * @namespace components
 * @class ProfileBadge
 * @constructor
 * @param {Object} props
 * @param {models.client.User} props.user
 * @param {Number} [props.size=50]
 * @param {Number} [props.padding=4]
 * @param {String} [props.tipPlacement=right]
 */
var ProfileBadge = React.createClass({

    propTypes: {
        user: React.PropTypes.instanceOf(User).isRequired,
        size: React.PropTypes.number,
        padding: React.PropTypes.number,
        tipPlacement: React.PropTypes.string
    },

    getDefaultProps: function() {
        return {
            tipPlacement: "right",
            size: 50,
            padding: 4
        };
    },

    getInitialState: function() {
        return {
            // Use max size until resolveRealImageSize completes
            width: this.props.size - this.props.padding,
            height: this.props.size - this.props.padding
        };
    },

    componentDidMount: function() {
        this.resolveRealImageSize();
    },

    /**
     * Image size is available only after the image is loaded. Load the image
     * and read it to the state.
     *
     * @method resolveRealImageSize
     */
    resolveRealImageSize: function() {
        var img = new Image();
        img.onload = function() {
            if (!this.isMounted()) return;
            this.setState({ width: img.width, height: img.height });
        }.bind(this);
        img.src = this.getImgURL();
    },

    getImgURL: function() {
        return this.props.user.getProfileImage();
    },

    renderImage: function(width, height) {

        var size = this.props.size;

        if (this.props.user.isEmailOnly()) {
            return <i className="fa fa-envelope"
                style={{ fontSize: size/2 + "px" }}></i>;
        }

        return <img src={this.getImgURL()} width={width} height={height} />;
    },

    renderTooltip: function() {
        var user = this.props.user;
        return (
            <span>
                {user.getFullName()}
                <br />
                {user.getDomainUsername()}
            </span>
        );
    },

    getSizeInCSS: function() {
        return {
            width: this.props.size + "px",
            height: this.props.size + "px"
        };
    },

    render: function() {
        var padding = this.props.padding;
        var srcWidth = this.state.width;
        var srcHeight = this.state.height;
        var maxWidth = this.props.size;
        var maxHeight = this.props.size;

        // credits http://stackoverflow.com/a/14731922/153718
        var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
        var width = Math.round(srcWidth * ratio) - padding;
        var height = Math.round(srcHeight * ratio) - padding;

        return (
            <OverlayTrigger
                placement={this.props.tipPlacement}
                overlay={<Tooltip>{this.renderTooltip()}</Tooltip>}>

                <div className="ProfileBadge">
                    <div className="wrap" style={this.getSizeInCSS()}>
                        <div className="inner-wrap">
                            {this.renderImage(width, height)}
                        </div>
                    </div>
                </div>
            </OverlayTrigger>
        );
    }
});


module.exports = ProfileBadge;
