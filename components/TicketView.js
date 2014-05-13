/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var _ = require("lodash");

var Ticket = require("../models/client/Ticket");
var Comment = require("../models/client/Comment");
var EventMixin = require("../utils/EventMixin");
var Lightbox = require("./Lightbox");
var AddDevice = require("./AddDevice");

/**
 * TicketView
 *
 * @namespace components
 * @class TicketView
 */
var TicketView = React.createClass({

    mixins: [EventMixin],

    getInitialState: function() {
        return {
            comment: "",
            ticketModel: this.createBoundEmitter(Ticket)
        };
    },

    componentWillMount: function() {
        this.setupModel();
    },

    componentWillReceiveProps: function() {
        this.setupModel();
    },

    handleChange: function() {
        this.state.ticketModel.set({
            description: this.refs.description.getDOMNode().value,
            title: this.refs.title.getDOMNode().value,
        });
    },

    handleAddComment: function() {
        var comment = new Comment({ comment: this.state.comment });

        this.state.ticketModel.updates().add(comment);

        var self = this;
        return comment.save()
            .then(function() {
                self.setState({ comment: "" });
            });
    },

    handleCommentChange: function(e) {
        this.setState({ comment: e.target.value });
    },

    hasUnsavedComment: function() {
        return !!this.state.comment;
    },


    handleClose: function() {
        this.state.ticketModel.close();
    },

    isOperating: function() {
        return this.state.ticketModel.isOperating();
    },

    /**
     * clear the model for new tickets
     *
     * @method setupModel
     */
    setupModel: function() {
        if (this.state.ticketModel.get("id") !== this.props.ticketId) {
            this.state.ticketModel.reset();
            this.state.ticketModel.set({ id: this.props.ticketId });
            this.state.ticketModel.fetch();
            this.state.ticketModel.updates().fetch();
        }

    },


    handleAddDevice: function(e) {
        Lightbox.displayComponent(
            <AddDevice ticketModel={this.state.ticketModel} />
        );
    },

    render: function() {
        console.log("render TickerForm: updates: ", this.state.ticketModel.updates().size());
        return (
            <div className="ticket-form">

                {this.isOperating() && <p>Ladataan...</p>}

                <h1>
                    {this.state.ticketModel.get("title")}
                    <span>
                        ({this.state.ticketModel.getCurrentStatus()})
                    </span>
                </h1>

                <p>{this.state.ticketModel.get("description")}</p>

                <div>
                    <ul>
                        {this.state.ticketModel.updates().map(function(update) {
                            var out;

                            if (update.get("type") === "devices") {
                                out = "Laite " + update.get("hostname");
                            }
                            else {
                                out = update.get("comment");
                            }

                            if (!out) {
                                out = JSON.stringify(_.omit(update.toJSON(),
                                    "ticket_id",
                                    "createdBy",
                                    "created_by",
                                    "created_at",
                                    "updated_at",
                                    "deleted_at",
                                    "deleted_by",
                                    "unique_id"
                               ));
                            }

                            var user = update.get("createdBy");
                            if (user) {
                                out += ". Lähetti " + user.external_data.username;
                            }

                            if (update.saving) {
                                out  += " (saving...)";
                            }

                            return <li>{out}</li>;
                        })}
                    </ul>
                    <input
                        ref="comment"
                        type="text"
                        onChange={this.handleCommentChange}
                        value={this.state.comment}
                    />
                    <button
                        onClick={this.handleAddComment}
                        disabled={this.state.ticketModel.isOperating() || !this.hasUnsavedComment()} >Lähetä</button>
                    <button onClick={this.handleAddDevice} >Lisää laite</button>
                    <button onClick={this.handleClose} >Aseta ratkaistuksi</button>
                </div>


            </div>
        );
    },

});

module.exports = TicketView;
