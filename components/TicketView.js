/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var _ = require("lodash");
var Promise = require("bluebird");
var Backbone = require("backbone");

var Button = require("react-bootstrap/Button");
var Badge = require("react-bootstrap/Badge");

var Loading = require("./Loading");
var Handler = require("../models/client/Handler");
var Base = require("../models/client/Base");
var SelectUsers = require("./SelectUsers");
var SideInfo = require("./SideInfo");




/**
 * TicketView
 *
 * @namespace components
 * @class TicketView
 */
var TicketView = React.createClass({

    getInitialState: function() {
        return {
            showTags: true,
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

    /**
     * Save comment handler. Reports any unhandled errors to the global error
     * handler
     *
     * @method saveComment
     */
    saveComment: function() {
        if (!this.hasUnsavedComment()) return;

        this.props.ticket.addComment(this.state.comment, this.props.user)
        .then(function() {
            window.scrollTo(0, document.body.scrollHeight);
        })
        .catch(Backbone.trigger.bind(Backbone, "error"));

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


    toggleTags: function() {
        this.setState({
            showTags: !this.state.showTags
        });
    },

    handleAddHandler: function() {
        var self = this;
        self.props.renderInModal("Lisää käsittelijöitä", function(close){
            return (
                <SelectUsers
                    currentHandlers={_.invoke(self.props.ticket.handlers(), "getHandlerUser")}
                    onCancel={close}
                    onSelect={function(users) {

                        var handlers = users.map(function(user) {
                            return new Handler({ handler: user.toJSON() }, { parent: self.props.ticket });
                        });


                        Promise.all(_.invoke(handlers, "save"))
                        .then(function() {
                            return self.props.ticket.fetch();
                        })
                        .catch(Backbone.trigger.bind(Backbone, "error"));
                        close();
                }}/>
            );
        });
    },

    handleOnFocus: function() {
        this.markAsRead();

        this.props.ticket.fetch()
        .catch(Backbone.trigger.bind(Backbone, "error"));
    },

    markAsRead: function() {
        this.props.ticket.markAsRead()
        .catch(Backbone.trigger.bind(Backbone, "error"));
    },

    componentWillReceiveProps: function(nextProps) {
        if (!this.initialReadMark && nextProps.ticket.hasData()) {
            // Usually we would use the component state for this but because it
            // is asynchronous it causes multiple unwanted markAsRead calls.
            // So use a plain component property to workaround it.
            this.initialReadMark = true;

            // It seems that updates uppon receiving props is illegal. Mark on
            // next event loop tick.
            setTimeout(this.markAsRead, 0);
        }
    },

    componentDidMount: function() {
        window.addEventListener("focus", this.handleOnFocus);
    },

    componentWillUnmount: function() {
        window.removeEventListener("focus", this.handleOnFocus);
    },

    renderBadge: function() {
        var status = this.props.ticket.getCurrentStatus();
        switch (status) {
            case "open":
                return <Badge className={status}>Ratkaisematon</Badge>;
            case "closed":
                return <Badge className={status}>Ratkaistu</Badge>;
        }
    },
    renderDate: function() {
        var datestring = this.props.ticket.get("created_at"),
        options={weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute:"numeric"};
        return(
            <span className="badge-text">
                <time dateTime={'"' + datestring + '"'} />{" " + new Date(Date.parse(datestring)).toLocaleString('fi', options)}
            </span>
        );
    },

    render: function() {
        var self = this;
        return (
            <div className="row">
                <div className="ticket-view col-md-8">

                    {this.isOperating() && <Loading />}

                    <div className="ticket-title ticket-updates">
                        <div className="update-buttons-wrap row">
                            <div className="badges col-md-3">
                                <span className="badge-text">
                                {"Tiketti #" + this.props.ticket.get("id") + " "}
                                </span>
                                {this.renderBadge()}
                            </div>
                            <div className="update-buttons col-md-9">
                                {this.props.user.isManager() &&
                                    <Button bsStyle="success" onClick={this.handleAddHandler} >
                                        <i className="fa fa-user"></i>Lisää käsittelijä
                                    </Button>
                                }
                                {this.props.user.isManager() &&
                                    <ToggleTagsButton active={this.state.showTags} onClick={this.toggleTags} />
                                }
                                {this.props.ticket.isHandler(this.props.user) &&
                                    <ToggleStatusButton ticket={this.props.ticket} user={this.props.user} />
                                }
                            </div>
                        </div>
                        <div className="header ticket-header">
                            <h3>
                                {this.props.ticket.get("title") + " "} {/* ({this.props.ticket.getCurrentStatus()}) */}
                            </h3>
                            {this.renderDate()}
                        </div>
                        <div className="image">
                            <img src={this.props.ticket.createdBy().getProfileImage()} />
                        </div>
                        <div className="message">
                             <span>
                                <strong>
                                    {this.props.ticket.createdBy().getName() + " "}
                                </strong>
                            </span><br />
                            <span>
                                {this.props.ticket.get("description")}
                            </span>
                        </div>
                    </div>

                    <div className="ticket-updates comments">
                        <div className="image">
                            <img src="/images/support_person.png" />
                        </div>
                        <div className="message">
                            <strong>Opinsys tuki </strong>
                            <span>Olemme vastaanottaneet tukipyyntösi. Voit halutessasi täydentää sitä.</span>
                        </div>
                    </div>
                    <div>
                    {this.props.ticket.updates()
                        .filter(function(update) {
                            if (self.state.showTags && update.get("type") === "tags") {
                                return false;
                            }

                            return true;
                        })
                        .map(function(update) {
                            var view = VIEW_TYPES[update.get("type")];
                            return (
                                <span key={update.get("unique_id")}>
                                    {view ?  view({ update: update })
                                          : "Unknown update type: " + update.get("type")
                                    }
                                </span>
                        );})}
                    </div>
                        <textarea
                            className="form-control"
                            ref="comment"
                            type="text"
                            onChange={this.handleCommentChange}
                            onKeyUp={this.handleCommentKeyUp}
                            value={this.state.comment}
                            placeholder="Kirjoita kommentti..."
                        />
                    <div className="ticket-update-buttons">
                        <Button
                            onClick={this.saveComment}
                            disabled={this.props.ticket.isOperating() || !this.hasUnsavedComment()} >Lähetä
                        </Button>
                    </div>
                </div>
                <div className="sidebar col-md-4">
                    <SideInfo>
                    </SideInfo>
                </div>
            </div>
        );
    },

});


/**
 * ToggleTagsButton
 *
 * @namespace components
 * @class ToggleTagsButton
 */
var ToggleTagsButton = React.createClass({

    propTypes: {
        active: React.PropTypes.bool.isRequired,
        onClick: React.PropTypes.func
    },

    render: function() {
        var text = "Näytä tapahtumat";
        if (this.props.active) {
            text = "Piilota tapahtumat";
        }
        return (
            <Button bsStyle="success" className="btn-success" onClick={this.props.onClick}>
                <i className="fa fa-comments-o"></i>{text}
            </Button>
        );
    }
});


var UpdateMixin = {
    propTypes: {
        update: React.PropTypes.instanceOf(Base).isRequired
    },

    getCreatorName: function() {
        if (this.props.update.createdBy) {
            var createdBy = this.props.update.createdBy();
            if (!createdBy) return "Unknown";
            return createdBy.getName();
        }
        return "Unknown";
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
                <div className="ticket-updates comments">
                    <div className="image">
                        <img src={this.props.update.createdBy().getProfileImage()} />
                    </div>
                    <div className="message">
                        <strong>{this.props.update.createdBy().getName()} </strong>
                        <span>{this.props.update.get("comment")}</span>
                    </div>
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

    handleOpenTicket: function() {
        this.props.ticket.setOpen(this.props.user)
        .catch(Backbone.trigger.bind(Backbone, "error"));
    },

    handleCloseTicket: function() {
        this.props.ticket.setClosed(this.props.user)
        .catch(Backbone.trigger.bind(Backbone, "error"));
    },

    render: function() {
        var ticket = this.props.ticket;
        var status = ticket.getCurrentStatus();

        if (!status) return (
            <Button disabled >loading...</Button>
        );

        if (status === "open") return (
            <Button
                bsStyle="success"
                className="close-ticket"
                disabled={ticket.isOperating()}
                onClick={this.handleCloseTicket} >
                <i className="fa fa-check"></i>Aseta ratkaistuksi</Button>
        );

        return (
            <Button
                bsStyle="warning"
                className="reopen-ticket"
                disabled={ticket.isOperating()}
                onClick={this.handleOpenTicket} >
                <i className="fa fa-refresh"></i>Avaa uudelleen</Button>
        );

    }
});
module.exports = TicketView;
