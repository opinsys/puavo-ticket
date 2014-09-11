/** @jsx React.DOM */
"use strict";

var React = require("react/addons");
var filesize = require("filesize");

var ICONS = {
    code: {
         "application/x-shellscript": true,
         "application/javascript": true,
         "application/x-yaml": true,
         "text/xml": true,
         "text/x-go": true,
         "text/x-ruby": true,
         "text/x-python": true,
         "text/x-csrc": true,
         "text/html": true,
    },

    archive: {
         "application/zip": true,
         "application/gzip": true,
    }
};

/**
 * Visualize file on a list
 *
 * @namespace components
 * @class FileItem
 * @constructor
 * @param {Object} props
 * @param {String} props.name
 * @param {String} props.mime
 * @param {Number} props.size
 */
var FileItem = React.createClass({

    propTypes: {
        name: React.PropTypes.string.isRequired,
        mime: React.PropTypes.string.isRequired,
        size: React.PropTypes.number.isRequired
    },

    /**
     * Infer font-awesome icon for this file type. This is pretty shit but
     * better than nothing :)
     *
     * @method getFAIcon
     * @return {String}
     */
    getFAIcon: function() {
        var mime = this.props.mime;
        if (mime === "application/pdf") return "fa-file-pdf-o";
        if (mime === "text/plain") return "fa-file-text-o";
        if (ICONS.code[mime]) return "fa-file-code-o";
        if (ICONS.archive[mime]) return "fa-file-archive-o";
        if (/^image\/.+/.test(mime)) return "fa-file-image-o";
        if (/^video\/.+/.test(mime)) return "fa-file-video-o";
        if (/^audio\/.+/.test(mime)) return "fa-file-audio-o";
        return "fa-file-o";
    },

    render: function() {
        var name = this.props.name;
        var size = this.props.size;

        return (
            <span className="FileItem">
                <i className={"fa " + this.getFAIcon()} />
                {name}
                <span className="size">({filesize(size)})</span>
            </span>
        );
    }
});


module.exports = FileItem;
