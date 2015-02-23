"use strict";
var React = require("react/addons");
var classSet = React.addons.classSet;
var _ = require("lodash");
var Navigation = require("react-router").Navigation;
var RouteHandler = require("react-router").RouteHandler;

var Alert = require("react-bootstrap/Alert");

var app = require("../../index");
var Actions = require("../../Actions");
var Loading = require("../Loading");
var CommentForm = require("./CommentForm");
var AttachmentsForm = require("../AttachmentsForm");
var Ticket = require("../../models/client/Ticket");
var SideInfo = require("../SideInfo");
var Redacted = require("../Redacted");
var EditableText = require("../EditableText");
var UploadProgress = require("../UploadProgress");

var ToggleStatusButton = require("./ToggleStatusButton");
var ToggleFollowButton = require("./ToggleFollowButton");
var CommentUpdate = require("./CommentUpdate");


// Individual components for each ticket update type
var UPDATE_COMPONENTS = {
    comments: CommentUpdate,
    tags: require("./TagUpdate"),
    handlers: require("./HandlerUpdate"),
    titles: require("./TitleUpdate")
};



/**
 * @namespace components
 * @class Discuss
 * @constructor
 * @param {Object} props
 */
var Discuss = React.createClass({

    mixins: [Navigation],

    propTypes: {
        ticket: React.PropTypes.instanceOf(Ticket).isRequired,
    },

    getInitialState: function() {
        return {
            changeTitle: false,
            fetching: false,
            saving: false,
            showTags: true,
            scrolled: false,
            markingAsRead: false,
            uploadProgress: null
        };
    },

    /**
     * Called when a new live comment message is received from socket.io
     *
     * @private
     * @method _handleWatcherUpdate
     */
    _handleWatcherUpdate: function(comment) {
        if (comment.ticketId === this.props.ticket.get("id")) {
            this.fetchTicket();
        }
    },

    /**
     * Subscribe to the ticket updates
     *
     * @method startWatching
     */
    startWatching: function() {
        app.io.emit("startWatching", {
            ticketId: this.props.ticket.get("id")
        });
    },

    /**
     * Called when socket reconnects while the user is still watching it
     *
     * Restarts watching and refreshes the ticket
     *
     * @private
     * @method _handleSocketConnect
     */
    _handleSocketConnect: function() {
        this.startWatching();
        this.fetchTicket();
    },

    componentDidMount: function() {
        window.scrollTo(0, 0);
        app.io.on("watcherUpdate", this._handleWatcherUpdate);
        this.startWatching();

        app.io.on("connect", this._handleSocketConnect);

        this.scrollToAnchoredElement();
    },

    componentWillUnmount: function() {
        app.io.emit("stopWatching", {
            ticketId: this.props.ticket.get("id")
        });
        app.io.off("watcherUpdate", this._handleWatcherUpdate);
        app.io.off("connect", this._handleSocketConnect);
    },

    componentWillReceiveProps: function(nextProps) {
        var changed = this.props.ticket.get("updatedAt") !== nextProps.ticket.get("updatedAt");

        if (this.state.changingTitle && changed) {
            this.setState({ changingTitle: false });
        }


    },

    componentDidUpdate: function(prevProps) {
        var changed = this.props.ticket.get("updatedAt") !== prevProps.ticket.get("updatedAt");

        if (this.state.saving && changed) {
            this.refs.form.scrollToCommentButton();
            this.setState({ saving: false });
        } else {
            this.scrollToAnchoredElement();
        }


        // Must start the animation after updating in order to make the
        // css transition apply
        if (changed && this.props.ticket.hasUnreadComments(app.currentUser) && this.refs.lastComment.isVisible()) {
            this.animateMarkAsRead({ reset: true });
        }
    },


    /**
     * Anchor links (eg. #foobar) does not work on dynamically loaded elements
     * because they are not present at load time. This method manually scrolls
     * to the linked element when they appear.
     *
     * @method scrollToAnchoredElement
     */
    scrollToAnchoredElement: function() {
        // Nothing selected
        if (!window.location.hash) return;

        // No need to scroll multiple times
        if (this.state.scrolled) return;

        var el = document.getElementById(window.location.hash.slice(1));

        // Element not rendered yet - or it just does not exists
        if (!el)  return;

        el.scrollIntoView();
        this.setState({ scrolled: true });
    },



    /**
     * Save comment handler. Reports any unhandled errors to the global error
     * handler
     *
     * @method saveComment
     */
    saveComment: function(e) {
        var self = this;
        self.setState({ saving: true });

        var op = self.props.ticket.addComment(e.comment, {hidden: e.hidden});
        Actions.ajax.write(op);

        op.then(function(comment) {
            var files = self.refs.attachments.getFiles();
            if (files.length > 0) {
                self.refs.attachments.clear();
                return comment.addAttachments(files, { onProgress: function(e) {
                    self.setState({ uploadProgress: e });
                }});
            }
        })
        .catch(Actions.error.haltChain("Kommentin tallennus epäonnistui"))
        .then(function() {
            e.clear();
            self.setState({ uploadProgress: null });
        })
        .then(Actions.refresh);

    },


    handleClose: function() {
        this.props.ticket.close();
    },


    toggleTags: function() {
        this.setState({
            showTags: !this.state.showTags
        });
    },



    /**
     * Fetch the ticket data
     *
     * @method fetchTicket
     * @return {Bluebird.Promise}
     */
    fetchTicket: function() {
        if (!this.isMounted()) return;

        this.setState({ fetching: true });
        var op = this.props.ticket.fetch();
        Actions.ajax.read(op);
        return op.bind(this)
            .then(function() {
                if (this.isMounted()) this.setState({ fetching: false });
            })
            .catch(Ticket.NotFound, function(err) {
                this.setState({
                    notFound: err
                });
            })
            .catch(Actions.error.haltChain("Tukipyynnön tilan päivitys epäonnistui"));
    },




    renderDate: function() {
        var datestring = this.props.ticket.get("createdAt"),
        options={weekday: "long", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute:"numeric"};
        return(
            <span className="badge-text">
                <time dateTime={'"' + datestring + '"'} />{" " + new Date(Date.parse(datestring)).toLocaleString('fi', options)}
            </span>
        );
    },

    changeTitle: function(e) {
        this.setState({ changingTitle: true });
        this.props.ticket.addTitle(e.value)
        .catch(Actions.error.haltChain("Otsikon päivitys epäonnistui"))
        .then(Actions.refresh);
    },


    /**
     * Get array of updates with comments merged that are created by the same
     * user within small amount of time
     *
     * @method getUpdatesWithMergedComments
     * @return {Array} of models.client.Base
     */
    getUpdatesWithMergedComments: function(){
        return this.props.ticket.updates().reduce(function(a, next) {
            var prev = a.pop();
            if (!prev) {
                a.push(next);
                return a;
            }

            var bothComments = (
                prev.get("type") === "comments" &&
                next.get("type") === "comments"
            );

            var bothVisible = (
                !prev.get("hidden") &&
                !next.get("hidden")
            );

            // Do not merge emailed comments
            var bothWebSubmitted = (
                prev.get("textType") !== "email" &&
                next.get("textType") !== "email"
            );

            if (bothVisible && bothComments && bothWebSubmitted && prev.wasCreatedInVicinityOf(next)) {
                a.push(prev.merge(next));
                return a;
            }

            a.push(prev);
            a.push(next);
            return a;

        }, []);
    },


    animateMarkAsRead: function(options) {
        if (options && options.reset) {
            this.stopAnimateMarkAsRead();
        }

        if (this._markAsReadTimer) return;
        this.setState({ markingAsRead: true });

        this._markAsReadTimer = setTimeout(() => {
            setImmediate(this.stopAnimateMarkAsRead);
            console.log("actually marking as read");

            var op = this.props.ticket.markAsRead();
            Actions.ajax.write(op);

            op.catch(Actions.error.haltChain("Tukipyynnön merkkaaminen luetuksi epäonnistui"))
            .then(Actions.refresh);
        }, 5000);
    },

    stopAnimateMarkAsRead: function() {
        if (this._markAsReadTimer) {
            clearTimeout(this._markAsReadTimer);
            this._markAsReadTimer = null;
        }

        if (this.isMounted()) {
            this.setState({ markingAsRead: false });
        }
    },

    render: function() {
        if (this.state.notFound) {
            return <Alert bsStyle="danger">
                Hakemaasi tukipyyntöä ei ole olemassa.
            </Alert>;
        }


        var self = this;
        var ticket = this.props.ticket;
        var fetching = this.state.fetching;
        var user = app.currentUser;
        var title = ticket.getCurrentTitle();
        var updates = this.getUpdatesWithMergedComments();

        if (user.acl.canSeeZendeskLink() && ticket.get("zendeskTicketId")) {
            updates.unshift(ticket.createRobotComment(
                "Tämä tukipyyntö tuotiin Zendeskistä https://opinsys.zendesk.com/tickets/" + ticket.get("zendeskTicketId"),
                "zendesk"));
        }

        return (
            <div className="row Discuss">

                <div className="ticket-view col-md-8">

                    <Loading visible={fetching} />

                    <div className="row ticket-actions-row">
                        <div className="col-md-12">
                            {user.acl.canChangeStatus(ticket) &&
                                <ToggleStatusButton ticket={ticket} onChange={Actions.refresh} />}

                                <RouteHandler params={self.props.params} query={self.props.query} />

                            {user.acl.canFollow(ticket) &&
                                <ToggleFollowButton ticket={ticket} user={user} />}
                        </div>
                    </div>


                    <div className="row title-row">
                        <div className="col-md-12">


                            <EditableText onSubmit={this.changeTitle} text={title} disabled={!user.acl.canEditTitle(ticket)}>
                                <h3>
                                    <span className="Discuss-title">
                                        {user.acl.canSeeTicketDetails() &&
                                        <span className="Discuss-title-id">#{ticket.get("id")} </span>}
                                        {title || <Redacted>Ladataan otsikkoa</Redacted>}
                                    </span>
                                    {this.state.changingTitle && <Loading.Spinner />}
                                </h3>
                            </EditableText>
                        </div>
                    </div>

                    <div className="updates">
                        {updates.map(function(update) {
                            var UpdateComponent = UPDATE_COMPONENTS[update.get("type")];

                            if (!UpdateComponent) {
                                console.error("Unknown update type: " + update.get("type"));
                                return;
                            }

                            var unread = update.isUnreadBy(app.currentUser);
                            var className = classSet({
                                unread: unread,
                                "marking-as-read": self.state.markingAsRead && unread,
                                "Discuss-update-item": true
                            });

                            var lastProps = {};
                            if (update.getUniqueId() === _.last(updates).getUniqueId()) {
                                lastProps.onViewport = self.animateMarkAsRead;
                                lastProps.onOffViewport = self.stopAnimateMarkAsRead;
                                lastProps.ref = "lastComment";
                            }

                            return (
                                <div key={update.getUniqueId()} className={className}>
                                    <UpdateComponent {...lastProps} update={update} />
                                </div>
                            );
                        })}
                    </div>

                    <CommentForm onSubmit={this.saveComment} user={app.currentUser} ref="form" >
                        Lähetä {this.state.saving && <Loading.Spinner />}
                    </CommentForm>
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

module.exports = Discuss;
