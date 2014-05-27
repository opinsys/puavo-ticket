/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var _ = require("lodash");
var Promise = require("bluebird");

var Comment = require("../models/client/Comment");
var Handler = require("../models/client/Handler");
var Lightbox = require("./Lightbox");
var AddDevice = require("./AddDevice");
var SelectUsers = require("./SelectUsers");


/**
 * ToggleStatusButton
 *
 * @namespace components
 * @class ToggleStatusButton
 */
var ToggleStatusButton = React.createClass({

    render: function() {
        var ticket = this.props.ticketModel;
        var status = ticket.getCurrentStatus();

        if (!status) return (
            <button disabled={true} >loading...</button>
        );

        if (status === "open") return (
            <button
                disabled={ticket.isOperating()}
                onClick={ticket.setClosed.bind(ticket)} >Aseta ratkaistuksi</button>
        );

        return (
            <button
                disabled={ticket.isOperating()}
                onClick={ticket.setOpen.bind(ticket)} >Avaa uudelleen</button>
        );

    }
});

/**
 * TicketView
 *
 * @namespace components
 * @class TicketView
 */
var TicketView = React.createClass({

    getInitialState: function() {
        return {
            comment: "",
        };
    },

    handleChange: function() {
        this.props.ticket.set({
            description: this.refs.description.getDOMNode().value,
            title: this.refs.title.getDOMNode().value,
        });
    },


    handleCommentChange: function(e) {
        this.setState({ comment: e.target.value });
    },

    saveComment: function() {
        if (!this.hasUnsavedComment()) return;

        var comment = new Comment({ comment: this.state.comment });
        this.props.ticket.updates().add(comment);
        this.setState({ comment: "" });
        this.refs.comment.getDOMNode().focus();

        return comment.save();
    },

    handleCommentKeyUp: function(e) {
        if (e.key === "Enter") this.saveComment();
    },

    hasUnsavedComment: function() {
        return !!this.state.comment;
    },


    handleClose: function() {
        this.props.ticket.close();
    },

    isOperating: function() {
        return this.props.ticket.isOperating();
    },


    handleAddDevice: function(e) {
        Lightbox.displayComponent(
            <AddDevice ticketModel={this.props.ticket} />
        );
    },

    handleAddHandler: function() {
        var self = this;
        Lightbox.displayComponent(
            <SelectUsers onSelect={function(users) {

                var handlers = users.map(function(user) {
                    return new Handler({ user: user });
                });

                handlers.forEach(function(handler) {
                    self.props.ticket.updates().add(handler);
                });

                Promise.all(_.invoke(handlers, "save"))
                .then(function() {
                    console.log("handler save ok");
                })
                .catch(function(err) {
                    console.log("failed to save handlers", err);
                });


                Lightbox.removeCurrentComponent();
            }}/>
        );
    },

    render: function() {
        return (
            <div className="ticket-form">

                {this.isOperating() && <p>Ladataan...</p>}

                <h1>
                    {this.props.ticket.get("title")}
                    <span>
                        ({this.props.ticket.getCurrentStatus()})
                    </span>
                </h1>

                <p>{this.props.ticket.get("description")}</p>

                <div>
                    <ul>
                        {this.props.ticket.updates().map(function(update) {
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
                        onKeyUp={this.handleCommentKeyUp}
                        value={this.state.comment}
                    />
                    <button
                        onClick={this.saveComment}
                        disabled={this.props.ticket.isOperating() || !this.hasUnsavedComment()} >Lähetä</button>
                    <button onClick={this.handleAddDevice} >Lisää laite</button>
                    <ToggleStatusButton ticketModel={this.props.ticket} />
                    <button onClick={this.handleAddHandler} >Lisää käsittelijä</button>
                </div>


            </div>
        );
    },

});

module.exports = TicketView;
