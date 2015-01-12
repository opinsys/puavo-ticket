/** @jsx React.DOM */
"use strict";

var React = require("react/addons");
var Badge = require("react-bootstrap/Badge");
var Input = require("react-bootstrap/Input");
var Button = require("react-bootstrap/Button");
var Reflux = require("reflux");

var Ticket = require("../../models/client/Ticket");
var EditableList = require("../EditableList");
var Fa = require("../Fa");
var TicketStore = require("../../stores/TicketStore");
var ErrorActions = require("../../stores/ErrorActions");

/**
 * @namespace components
 * @class TagEditor
 * @constructor
 * @param {Object} props
 */
var TagEditor = React.createClass({

    mixins: [
        Reflux.listenTo(TicketStore, "onTicketUpdate")
    ],

    propTypes: {
        ticket: React.PropTypes.instanceOf(Ticket).isRequired,
    },

    onTicketUpdate: function() {
        if (!this.state.saving) return;
        this.setState({
            tag: "",
            saving: false,
        });
    },

    getInitialState: function() {
        return {
            tag: "",
            saving: false,
        };
    },

    removeTag: function(tag) {
        tag.destroy()
        .catch(ErrorActions.haltChain("Tagin poisto epäonnistui"))
        .then(TicketStore.Actions.refreshTicket);
    },

    validateBsStyle: function() {
        var tag = this.getTag();
        if (!tag) return "warning";
        if (this.props.ticket.hasTag(tag)) return "error";
        if (!/^[a-z0-9:\.]+$/.test(tag)) return "error";
        // TODO disable status tags here when we have proper component for status changes
        // if (/^status:.*$/.test(tag)) return "error";
        return "success";
    },

    ok: function() {
        return this.validateBsStyle() === "success" && !this.state.saving;
    },

    getTag: function() {
        return this.state.tag.trim();
    },

    addTag: function(e) {
        if (!this.ok()) return;
        var self = this;
        var ticket = this.props.ticket;

        self.setState({ saving: true });
        ticket.addTag(this.getTag())
        .catch(ErrorActions.haltChain("Tagin lisäys epäonnistui"))
        .then(TicketStore.Actions.refreshTicket);
    },

    render: function() {
        var self = this;
        var ticket = this.props.ticket;
        var saving = this.state.saving;

        var tags = ticket.rel("tags").filter(function(h) {
            return !h.isSoftDeleted();
        });

        return (
            <div className="TagEditor">
                <h1>Tagit</h1>

                <EditableList>
                    {tags.map(function(tag) {
                        var tagString = tag.get("tag");
                        return (
                            <EditableList.Item key={tagString}
                                disabled={tag.isStatusTag()}
                                onRemove={self.removeTag.bind(self, tag)} >
                                <Badge>{tagString}</Badge>
                            </EditableList.Item>
                        );
                    })}
                </EditableList>

                <form className="tag-form">
                    <Input type="text"
                        value={self.getTag()}
                        className="tag-input"
                        hasFeedback
                        bsStyle={self.validateBsStyle()}
                        placeholder="Uusi tagi"
                        href="taginput"
                        onChange={function(e) {
                            self.setState({ tag: e.target.value });
                        }}
                        onKeyDown={function(e) {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                self.addTag();
                            }
                    }} />
                    <Button disabled={!self.ok()} value="Lisää" onClick={function(e) {
                        e.preventDefault();
                        self.addTag();
                    }} >
                         Lisää
                    </Button>
                    {saving && <Fa icon="spinner" spin={true} />}
                </form>
            </div>
        );
    }

});


module.exports = TagEditor;
