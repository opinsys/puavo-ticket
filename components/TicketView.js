/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var _ = require("lodash");
var Promise = require("bluebird");

var Loading = require("./Loading");
var Handler = require("../models/client/Handler");
var Base = require("../models/client/Base");
var Lightbox = require("./Lightbox");
var AddDevice = require("./AddDevice");
var SelectUsers = require("./SelectUsers");



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

        this.props.ticket.addComment(this.state.comment, this.props.user)
        .then(function() {
            window.scrollTo(0, document.body.scrollHeight);
        });
        this.setState({ comment: "" });
        this.refs.comment.getDOMNode().focus();
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
            <SelectUsers
                currentHandlers={_.invoke(this.props.ticket.handlers(), "getHandlerUser")}
                onSelect={function(users) {

                    var handlers = users.map(function(user) {
                        return new Handler({ handler: user.toJSON() }, { parent: self.props.ticket });
                    });


                    Promise.all(_.invoke(handlers, "save"))
                    .then(function() {
                        return self.props.ticket.fetch();
                    });


                    Lightbox.removeCurrentComponent();
            }}/>
        );
    },

    handleOnFocus: function() {
        console.log("on focus");
        this.markAsRead();
    },

    markAsRead: function() {
        if (this.props.ticket.get("title")) {
            this.props.ticket.markAsRead();
        } else {
            setTimeout(this.markAsRead, 500);
        }
    },

    componentDidMount: function() {
        console.log("ADD LISTENER");
        window.addEventListener("focus", this.handleOnFocus);
        this.markAsRead();
    },

    componentWillUnmount: function() {
        console.log("REMOVE LISTENER");
        window.removeEventListener("focus", this.handleOnFocus);
    },

    render: function() {
        return (
            <div className="ticket-form">

                {this.isOperating() && <Loading />}

                <h2>
                    {this.props.ticket.get("title") + " "}
                    <span>
                        ({this.props.ticket.getCurrentStatus()})
                    </span>
                </h2>

                <p>{this.props.ticket.get("description")}</p>

                <div>
                    <ul>
                        {this.props.ticket.updates().map(function(update) {
                            var view = VIEW_TYPES[update.get("type")];
                            return (
                                <li key={update.get("unique_id")}>
                                    {view ?  view({ update: update })
                                          : "Unknown update type: " + update.get("type")
                                    }
                                </li>
                            );

                        })}
                    </ul>
                    <input
                        ref="comment"
                        type="text"
                        onChange={this.handleCommentChange}
                        onKeyUp={this.handleCommentKeyUp}
                        value={this.state.comment}
                        placeholder="Halutessasi voit lisätä kommentteja tähän."
                    />
                    <button
                        onClick={this.saveComment}
                        disabled={this.props.ticket.isOperating() || !this.hasUnsavedComment()} >Lähetä</button>
                    <button onClick={this.handleAddDevice} >Lisää laite</button>
                    <ToggleStatusButton ticket={this.props.ticket} user={this.props.user} />
                    <button onClick={this.handleAddHandler} >Lisää käsittelijä</button>
                </div>


            </div>
        );
    },

});

var UpdateMixin = {
    propTypes: {
        update: React.PropTypes.instanceOf(Base).isRequired
    },

    getCreatorName: function() {
        var createdBy = this.props.update.get("createdBy");
        if (!createdBy) return "Unknown";
        return createdBy.external_data.username;
    },
};

/**
 * Individual components for each ticket update type
 *
 * @namespace components
 * @private
 * @class TicketView.VIEW_TYPES
 */
var VIEW_TYPES = {

    comments: React.createClass({
        mixins: [UpdateMixin],
        render: function() {
            return (
                <div className="comments">
                    <i>{this.getCreatorName()}: </i>
                    <span>{this.props.update.get("comment")}</span>
                    {this.props.update.isNew() && <Loading />}
                </div>
            );
        },
    }),

    tags: React.createClass({
        mixins: [UpdateMixin],
        render: function() {
            return (
                <div className="tags">
                    <i>{this.getCreatorName()} lisäsi tagin: </i>
                    <span>{this.props.update.get("tag")}</span>
                    {this.props.update.isNew() && <Loading />}
                </div>
            );
        },
    }),

    handlers: React.createClass({
        mixins: [UpdateMixin],
        render: function() {
            return (
                <div className="tags">
                    <i>{this.getCreatorName()} lisäsi käsittelijäksi käyttäjän </i>
                    <span>{this.props.update.get("handler").external_data.username}</span>
                </div>
            );
        },
    })
};


/**
 * ToggleStatusButton
 *
 * @namespace components
 * @private
 * @class TicketView.ToggleStatusButton
 */
var ToggleStatusButton = React.createClass({

    render: function() {
        var ticket = this.props.ticket;
        var status = ticket.getCurrentStatus();

        if (!status) return (
            <button disabled={true} >loading...</button>
        );

        if (status === "open") return (
            <button
                disabled={ticket.isOperating()}
                onClick={ticket.setClosed.bind(ticket, this.props.user)} >
                Aseta ratkaistuksi
            </button>
        );

        return (
            <button
                disabled={ticket.isOperating()}
                onClick={ticket.setOpen.bind(ticket, this.props.user)} >
                Avaa uudelleen
            </button>
        );

    }
});

module.exports = TicketView;
