/** @jsx React.DOM */
"use strict";
var React = require("react/addons");

/**
 * Render React component in a modal lightbox
 *
 * @namespace components
 * @class Lightbox
 * @extends React.ReactComponent
 */
var Lightbox = React.createClass({

    render: function() {
        return (
            <div className="Lightbox">
                <div onClick={this.props.close} className="lightbox-bg"></div>
                <div className="lightbox clearfix">
                    <div className="lightbox-wrap">
                        {this.props.children}
                    </div>
                </div>
            </div>
        );
    }
});


module.exports = Lightbox;
