"use strict";
var React = require("react/addons");
var Button = require("react-bootstrap/Button");
var Navigation = require("react-router").Navigation;

var Actions = require("../Actions");
var SideInfo = require("./SideInfo");
var Loading = require("./Loading");
var ElasticTextarea = require("./ElasticTextarea");
var AttachmentsForm = require("./AttachmentsForm");
var UploadProgress = require("./UploadProgress");
var BackupInput = require("./BackupInput");

var BackboneMixin = require("./BackboneMixin");
var Ticket = require("../models/client/Ticket");

/**
 * Edit form for a ticket
 *
 * @namespace components
 * @class TicketForm
 * @extends React.ReactComponent
 */
var TicketForm = React.createClass({

    mixins: [BackboneMixin, Navigation],

    getInitialState: function() {
        return {
            saving: false,
            description: "",
            title: "",
            uploadProgress: null
        };
    },

    handleChange: function() {
        this.setState({
            title: this.refs.title.getDOMNode().value,
            description: this.refs.description.getDOMNode().value
        });
    },

    /**
     * @method handleSave
     */
    handleSave: function() {
        var self = this;
        self.setState({ saving: true });

        var op = new Ticket({}).save({
            title: self.state.title,
            description: self.state.description
        });
        Actions.ajax.write(op);

        op.then(function(savedTicket) {
            var comment = savedTicket.comments()[0];
            var files = self.refs.attachments.getFiles();

            if (files.length === 0) return savedTicket;

            self.refs.attachments.clear();
            var op = comment.addAttachments(files, {onProgress: function(e) {
                self.setState({ uploadProgress: e });
            }});
            Actions.ajax.write(op);

            return op.return(savedTicket);
        })
        .then(function(savedTicket) {
            self.refs.title.clearBackup();
            self.refs.description.clearBackup();
            self.setState({ uploadProgress: null });
            self.transitionTo("ticket", { id: savedTicket.get("id") });
        })
        .catch(Actions.error.haltChain("Tukipyynnön tallennus epäonnistui"));
    },

    isFormOk: function() {
        return this.state.title.trim() && this.state.description.trim();
    },

    render: function() {
        return (
            <div className="row TicketForm">
               <div className="ticket-form form-group col-md-8">
                    <div className="header">
                        <h3>Uusi tukipyyntö</h3>
                    </div>
                    <BackupInput
                        input="input"
                        backupKey="newtickettitle"
                        ref="title"

                        className="TicketForm-title form-control"
                        disabled={this.state.saving}
                        autoFocus
                        type="text"
                        onChange={this.handleChange}
                        onRestore={this.handleChange}
                        value={this.state.title}
                        placeholder="Tukipyyntöä kuvaava otsikko" />
                    <BackupInput
                        input={ElasticTextarea}
                        backupKey="newticketdescription"

                        minRows={10}
                        className="TicketForm-description form-control"
                        disabled={this.state.saving}
                        ref="description"
                        placeholder="Tarkka kuvaus tuen tarpeesta."
                        value={this.state.description}
                        onChange={this.handleChange}
                        onRestore={this.handleChange}
                    />

                    <div className="button-wrap">
                        <Button
                            className="TicketForm-save-ticket button save-button"
                            disabled={!this.isFormOk() || this.state.saving}
                            onClick={this.handleSave} >
                            Lähetä {this.state.saving && <Loading.Spinner />}
                        </Button>
                    </div>
                    <UploadProgress progress={this.state.uploadProgress} />
                    <AttachmentsForm ref="attachments" />
                </div>

                <div className="col-md-4">
                    <SideInfo />
                </div>

            </div>
        );
    },


});

module.exports = TicketForm;
