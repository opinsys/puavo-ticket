/** @jsx React.DOM */
"use strict";

var _ = require("lodash");
var React = require("react/addons");
var classSet = React.addons.classSet;
var Button = require("react-bootstrap/Button");
var filesize = require("filesize");

var FileItem = require("app/components/FileItem");

/**
 * AttachmentsForm
 *
 * @namespace components
 * @class AttachmentsForm
 * @constructor
 * @param {Object} props
 * @param {Number} [props] maxSize Max size for a single file to be uploaded
 */
var AttachmentsForm = React.createClass({

    propTypes: {
        maxSize: React.PropTypes.number
    },

    getDefaultProps: function() {
        // 50mb
        return { maxSize: 5e+7 };
    },

    getInitialState: function() {
        return {
            files: []
        };
    },

    /**
     * @method isUnderSizeLimit
     * @param {HTML5 File Object} file
     * @return Boolean
     */
    isUnderSizeLimit: function(file) {
        return file.size < this.props.maxSize;
    },

    /**
     * Get files selected by the user
     *
     * @method getFiles
     * @return {Array} of HTML 5 File objects
     */
    getFiles: function() {
        return this.state.files.filter(this.isUnderSizeLimit);
    },

    /**
     * Clear selected files
     *
     * @method clear
     */
    clear: function() {
        this.setState({ files: [] });
    },

    /**
     * Copy HTML 5 file objects from the file input to the component state
     *
     * @method handleFileChange
     */
    handleFileChange: function(e) {
        this.setState({
            files: _.uniq(this.state.files.concat(_.toArray(e.target.files)), toUniqueId)
        });
        // http://stackoverflow.com/a/13351234/153718
        this.refs.form.getDOMNode().reset();
    },

    /**
     * @method removeFile
     * @param {HTML5 File Object} file Remove given file from the component
     * state
     */
    removeFile: function(file) {
        this.setState({
            files: this.state.files.filter(function(current) {
                return current !== file;
            })
        });
    },

    /**
     * Open file section dialog
     *
     * @method openFileDialog
     */
    openFileDialog: function(e) {
        if (e) e.preventDefault();
        this.refs.file.getDOMNode().click();
    },

    render: function() {
        var self = this;
        var files = this.state.files;
        var totalSize = files.reduce(function(total, f) {
            return total + f.size;
        }, 0);

        return (
            <div className="AttachmentsForm" style={{ display: "block" }}>
                <form ref="form" style={{ display: "none" }}>
                    <input type="file" ref="file" multiple onChange={self.handleFileChange} />
                </form>


                <ul>
                    {files.map(function(f) {
                        var isTooLarge = !self.isUnderSizeLimit(f);
                        var classes = classSet({
                            "too-large": isTooLarge
                        });

                        return <li key={toUniqueId(f)} >
                            <Button className="remove-button" bsStyle="danger" bsSize="xsmall" onClick={self.removeFile.bind(self, f)} >×</Button>
                            <span className={classes} >
                                <FileItem mime={f.type} name={f.name} size={f.size} />
                            </span>
                            {isTooLarge &&
                                <div className="size-error-message">
                                    Tiedosto on liian suuri ladattavaksi.
                                    Suurin mahdollinen koko on {filesize(self.props.maxSize)}
                                </div>}
                        </li>;
                    })}
                    {files.length > 1 && <li className="total">
                        Yhteensä {filesize(totalSize)}
                    </li>}
                </ul>


                <a className="select-button" href="#" onClick={this.openFileDialog}>Liitä tiedosto...</a>
            </div>
        );
    }
});

/**
 * Figure out an unique id for a HTML 5 File Object
 *
 * Not perfect...
 *
 * @static
 * @private
 * @method toUniqueId
 * @param {HTML5 File Object} file
 * @return {String}
 */
function toUniqueId(file) {
    return file.name + (file.lastModifiedDate || "") + String(file.size);
}

module.exports = AttachmentsForm;
