/** @jsx React.DOM */
"use strict";
var React = require("react/addons");

/**
 * A simple loading spinner
 *
 * http://tobiasahlin.com/spinkit/
 *
 * @namespace components
 * @class Loading
 * @extends React.ReactComponent
 * @constructor
 * @param {Boolean} props.visible Set false to make the spinner invisible
 */
var Loading = React.createClass({

    getDefaultProps: function() {
        return {
            visible: true,
            className: ""
        };
    },

    getStyles: function() {
        var val = this.props.visible ? "visible" : "hidden";
        return { visibility: val };
    },

    render: function() {
        return (
            <div className={"Loading spinner " + this.props.className} style={this.getStyles()}>

              <div className="spinner-container container1">
                <div className="circle1"></div>
                <div className="circle2"></div>
                <div className="circle3"></div>
                <div className="circle4"></div>
              </div>
              <div className="spinner-container container2">
                <div className="circle1"></div>
                <div className="circle2"></div>
                <div className="circle3"></div>
                <div className="circle4"></div>
              </div>
              <div className="spinner-container container3">
                <div className="circle1"></div>
                <div className="circle2"></div>
                <div className="circle3"></div>
                <div className="circle4"></div>
              </div>

            </div>
        );
    }
});

/**
 * Font awesome spinner icon
 *
 * http://fortawesome.github.io/Font-Awesome/examples/#spinning
 *
 * @class Loading.Spinner
 * @extends React.ReactComponent
 */
Loading.Spinner = React.createClass({
    render: function() {
        return <i {...this.props} className="Spinner fa fa-spinner fa-spin" />;
    }
});

module.exports = Loading;
