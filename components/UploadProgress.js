"use strict";
var React = require("react");
var ProgressBar = require("react-bootstrap/lib/ProgressBar");

/**
 * UploadProgress
 *
 * @namespace components
 * @class UploadProgress
 * @constructor
 * @param {Object} props
 * @param {Object} props.progress
 */
var UploadProgress = React.createClass({

    propTypes: {
        progress: React.PropTypes.shape({
            percentage: React.PropTypes.number.isRequired
        }),
    },

    render: function() {
        var uploadProgress = this.props.progress;
        if (!uploadProgress) return null;

        return (
            <div className="UploadProgress">
                <ProgressBar now={uploadProgress.percentage} label="%(percent)s%" />
            </div>
        );
    }
});


module.exports = UploadProgress;
