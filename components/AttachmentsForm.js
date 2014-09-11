/** @jsx React.DOM */
"use strict";

var _ = require("lodash");
var React = require("react/addons");
var Button = require("react-bootstrap/Button");

var FileItem = require("app/components/FileItem");

/**
 * AttachmentsForm
 *
 * @namespace components
 * @class AttachmentsForm
 * @constructor
 * @param {Object} props
 */
var AttachmentsForm = React.createClass({

    getInitialState: function() {
        return {
            files: []
        };
    },

    /**
     * Get files selected by the user
     *
     * @method getFiles
     * @return {Array} of HTML 5 File objects
     */
    getFiles: function() {
        return this.state.files;
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
            files: this.state.files.concat(_.toArray(e.target.files))
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

        return (
            <div className="AttachmentsForm" style={{ display: "block" }}>
                <form ref="form" style={{ display: "none" }}>
                    <input type="file" ref="file" multiple onChange={self.handleFileChange} />
                </form>


                <ul>
                    {files.map(function(f) {
                        return <li key={f.name}  >
                            <Button className="remove-button" bsStyle="danger" bsSize="xsmall" onClick={self.removeFile.bind(self, f)} >×</Button>
                            <FileItem mime={f.type} name={f.name} size={f.size} />
                        </li>;
                    })}
                </ul>

                <a className="select-button" href="#" onClick={this.openFileDialog}>Liitä tiedosto...</a>
            </div>
        );
    }
});

module.exports = AttachmentsForm;
