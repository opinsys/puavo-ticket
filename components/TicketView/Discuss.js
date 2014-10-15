
/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var classSet = React.addons.classSet;
var _ = require("lodash");
var debug = require("debug")("app:read");
var Navigation = require("react-router").Navigation;

var Badge = require("react-bootstrap/Badge");
var Alert = require("react-bootstrap/Alert");

var Loading = require("../Loading");
var CommentForm = require("../CommentForm");
var AttachmentsForm = require("../AttachmentsForm");
var captureError = require("../../utils/captureError");
var Ticket = require("../../models/client/Ticket");
var User = require("../../models/client/User");
var SideInfo = require("../SideInfo");
var Redacted = require("../Redacted");
var EditableText = require("../EditableText");
var BrowserTitle = require("app/utils/BrowserTitle");
var UploadProgress = require("app/components/UploadProgress");

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
 * @param {models.client.User} props.user
 * @param {Socket.IO} props.io Socket.IO socket
 * @param {BrowserTitle} props.title BrowserTitle instance
 */
var Discuss = React.createClass({

    mixins: [Navigation],

    propTypes: {
        title: React.PropTypes.instanceOf(BrowserTitle).isRequired,
        user: React.PropTypes.instanceOf(User).isRequired,
        ticket: React.PropTypes.instanceOf(Ticket).isRequired,
        io: React.PropTypes.shape({
            on: React.PropTypes.func.isRequired,
            off: React.PropTypes.func.isRequired
        }).isRequired
    },

    getInitialState: function() {
        return {
            changeTitle: false,
            fetching: false,
            saving: false,
            showTags: true,
            scrolled: false,
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
        this.props.io.emit("startWatching", {
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
        this.props.io.on("watcherUpdate", this._handleWatcherUpdate);
        this.startWatching();

        this.props.io.on("connect", this._handleSocketConnect);

        /**
         * Lazy version of the `markAsRead()` method. It will mark the ticket
         * as read at max once in 10 seconds
         *
         * @method lazyMarkAsRead
         */
        this.lazyMarkAsRead = _.throttle(this.markAsRead, 5*1000);
    },

    componentWillUnmount: function() {
        this.props.io.emit("stopWatching", {
            ticketId: this.props.ticket.get("id")
        });
        this.props.io.off("watcherUpdate", this._handleWatcherUpdate);
        this.props.io.off("connect", this._handleSocketConnect);
        this.props.title.setTitle("");
        this.props.title.activateOnNextTick();
    },

    componentDidUpdate: function() {
        this.scrollToAnchoredElement();
    },


    /**
     * Anchor links (eg. #foobar) does not work on dynamically loaded elements
     * because they are not present at load time. This method manually scrolls
     * to the linked element when they appear.
     *
     * @method scrollToAnchoredElement
     */
    scrollToAnchoredElement: function() {
        var unread = this.props.ticket.firstUnreadUpdateFor(this.props.user);

        // Remove ?scrollTo=firstUnread query string and set
        // window.location.hash
        if (unread && this.props.query.scrollTo === "firstUnread") {
            this.replaceWith(this.props.name, this.props.params);
            window.location.hash = unread.getUniqueId();
        }

        // Nothing selected
        if (!window.location.hash) return;

        // No need to scroll multiple times
        if (this.state.scrolled) return;

        var el = document.getElementById(window.location.hash.slice(1));
        // Element not rendered yet - or it just does not exists
        if (!el) return;

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
        e.clear();
        self.setState({ saving: true });

        self.props.ticket.addComment(e.comment)
        .then(function(comment) {
            var files = self.refs.attachments.getFiles();
            if (files.length > 0) {
                self.refs.attachments.clear();
                return comment.addAttachments(files, { onProgress: function(e) {
                    self.setState({ uploadProgress: e });
                }});
            }
        })
        .then(function() {
            self.setState({ uploadProgress: null });
            return self.fetchTicket();
        })
        .then(function() {
            if (!self.isMounted()) return;
            self.setState({ saving: false });
            process.nextTick(e.scrollToCommentButton);
        })
        .catch(captureError("Kommentin tallennus epäonnistui"));

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
     * Mark the ticket as read by the current user and refetch the ticket data
     *
     * @method markAsRead
     * @return {Bluebird.Promise}
     */
    markAsRead: function() {
        if (!this.isMounted()) return;

        this.setState({ fetching: true });
        debug("Actually marking as read");
        return this.props.ticket.markAsRead()
            .bind(this)
            .then(function() {
                return this.fetchTicket();
            })
            .catch(captureError("Tukipyynnön merkkaaminen luetuksi epäonnistui"));
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
        return this.props.ticket.fetch()
            .bind(this)
            .then(function() {
                if (this.isMounted()) this.setState({ fetching: false });
            })
            .catch(Ticket.NotFound, function(err) {
                this.setState({
                    notFound: err
                });
            })
            .catch(captureError("Tukipyynnön tilan päivitys epäonnistui"));
    },



    renderBadge: function() {

        var id = "#" + this.props.ticket.get("id");

        var status = this.props.ticket.getCurrentStatus();
        switch (status) {
            case "pending":
                return <Badge className="ticket-status ticket-pending">Odottava {id}</Badge>;
            case "open":
                return <Badge className="ticket-status ticket-open">Avoin {id}</Badge>;
            case "closed":
                return <Badge className="ticket-status ticket-closed">Ratkaistu {id}</Badge>;
            default:
                return <Badge className="ticket-status"> <Redacted>Unknown</Redacted></Badge>;
        }
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
        .delay(2000)
        .bind(this)
        .then(function() {
            if (!this.isMounted()) return;
            return this.fetchTicket();
        })
        .then(function() {
            if (!this.isMounted()) return;
            this.setState({ changingTitle: false });
        })
        .catch(captureError("Otsikon päivitys epäonnistui"));
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

            if (bothComments && prev.wasCreatedInVicinityOf(next)) {
                a.push(prev.merge(next));
                return a;
            }

            a.push(prev);
            a.push(next);
            return a;

        }, []);
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
        var user = this.props.user;
        var title = ticket.getCurrentTitle();
        var updates = this.getUpdatesWithMergedComments();

        if (user.isManager() && ticket.get("zendeskTicketId")) {
            updates.unshift(ticket.createRobotComment(
                "Tämä tukipyyntö tuotiin Zendeskistä https://opinsys.zendesk.com/tickets/" + ticket.get("zendeskTicketId"),
                "zendesk"));
        }


        this.props.title.setTitle(title);
        this.props.title.activateOnNextTick();

        return (
            <div className="row Discuss">

                <div className="ticket-view col-md-8">

                    <Loading visible={fetching} />

                    <div className="row ticket-actions-row">
                        <div className="col-md-12">
                            {ticket.isHandler(user) &&
                                <ToggleStatusButton ticket={ticket} user={user} />}

                                <this.props.activeRouteHandler />

                            {ticket.createdBy().get("id") !== user.get("id") &&
                                <ToggleFollowButton ticket={ticket} user={user} />}
                        </div>
                    </div>

                    <div className="row title-row">
                        <div className="col-md-12">
                            <EditableText onSubmit={this.changeTitle} text={title} disabled={!ticket.isHandler(user)}>
                                <h3>
                                    {this.renderBadge()}

                                    <span className="ticket-title">
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

                            var className = classSet({
                                unread: update.isUnreadBy(self.props.user)
                            });


                            return (
                                <div key={update.getUniqueId()} className={className}>
                                    <UpdateComponent update={update} onViewport={function(props) {
                                        if (_.last(updates) !== props.update) return;
                                        // Mark the ticket as read 5 seconds
                                        // after the last update has been shown
                                        // to the user
                                        debug("Last comment is visible. Going to mark it read soon!");
                                        setTimeout(function() {
                                            self.lazyMarkAsRead();
                                        }, 5*1000);
                                    }} />
                                </div>
                            );
                        })}
                    </div>

                    <CommentForm onSubmit={this.saveComment} >
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
