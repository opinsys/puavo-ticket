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
 */
var Loading = React.createClass({
    render: function() {
        return (
            <div className="spinner">
              <div className="bounce1"></div>
              <div className="bounce2"></div>
              <div className="bounce3"></div>
            </div>
        );
    }
});

module.exports = Loading;
