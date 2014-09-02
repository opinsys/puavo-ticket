/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var Router = require("react-router");
var classSet = React.addons.classSet;
var _ = require("lodash");
var Promise = require("bluebird");

var Button = require("react-bootstrap/Button");
var Badge = require("react-bootstrap/Badge");
var Loading = require("../Loading");
var CommentForm = require("../CommentForm");

var captureError = require("../../utils/captureError");
var BackboneMixin = require("../../components/BackboneMixin");
var Ticket = require("../../models/client/Ticket");
var User = require("../../models/client/User");
var Loading = require("../Loading");
var SelectUsers = require("../SelectUsers");
var SideInfo = require("../SideInfo");
var Redacted = require("../Redacted");
var EditableText = require("../EditableText");

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
 * TicketView
 *
 * @namespace components
 * @class TicketView
 * @constructor
 * @param {Object} props
 * @param {models.client.User} props.user
 * @param {Socket.IO} props.io Socket.IO socket
 * @param {Function} props.renderInModal
 */
var TicketView = React.createClass({

    mixins: [BackboneMixin],

    propTypes: {
        user: React.PropTypes.instanceOf(User).isRequired,
        renderInModal: React.PropTypes.func.isRequired,
        io: React.PropTypes.shape({
            on: React.PropTypes.func.isRequired,
            off: React.PropTypes.func.isRequired
        }).isRequired
    },

    createInitialState: function(props) {
        return {
            ticket: new Ticket({ id: props.params.id }),
            changeTitle: false,
            fetching: true,
            saving: false,
            showTags: true,
            scrolled: false
        };
    },

    getInitialState: function() {
        return this.createInitialState(this.props);
    },

    componentWillReceiveProps: function(nextProps) {
        if (this.props.params.id === nextProps.params.id) return;
        this.setBackbone(this.createInitialState(nextProps), this.fetchTicket);
    },

    /**
     * Called when a new live comment message is received from socket.io
     *
     * @private
     * @method _onLiveComment
     */
    _onLiveComment: function(comment) {
        if (comment.ticketId === this.state.ticket.get("id")) {
            this.fetchTicket();
        }
    },


    componentDidMount: function() {
        window.scrollTo(0, 0);
        this.fetchTicket();
        window.addEventListener("focus", this.handleOnFocus);
        this.props.io.on("comment", this._onLiveComment);

        /**
         * Lazy version of the `markAsRead()` method. It will mark the ticket
         * as read at max once in 10 seconds
         *
         * @method lazyMarkAsRead
         */
        this.lazyMarkAsRead = _.throttle(this.markAsRead, 10*1000);
    },

    componentDidUpdate: function() {
        this.scrollToAnchoredElement();
    },

    componentWillUnmount: function() {
        window.removeEventListener("focus", this.handleOnFocus);
        this.props.io.off("comment", this.onLiveComment);
    },

    /**
     * Set window.location.hash to unique id of the first unread ticket comment
     *
     * @private
     * @method _redirectToFirstUnread
     */
    _redirectToFirstUnread: function() {
        var unread = this.state.ticket.firstUnreadUpdateFor(this.props.user);
        if (!unread) return;
        window.location.hash = unread.getUniqueId();
    },

    /**
     * Anchor links (eg. #foobar) does not work on dynamically loaded elements
     * because they are not present at load time. This method manually scrolls
     * to the linked element when they appear.
     *
     * @method scrollToAnchoredElement
     */
    scrollToAnchoredElement: function() {

        // Remove ?scrollTo=firstUnread query string and set
        // window.location.hash
        if (this.props.query.scrollTo === "firstUnread") {
            Router.replaceWith(this.props.name, this.props.params);
            this._redirectToFirstUnread();
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
        e.clear();
        this.setState({ saving: true });

        this.state.ticket.addComment(e.comment)
        .bind(this)
        .then(function() {
            return this.markAsRead();
        })
        .then(function() {
            if (!this.isMounted()) return;
            this.setState({ saving: false });
            process.nextTick(e.scrollToCommentButton);
        })
        .catch(captureError("Kommentin tallennus epäonnistui"));

    },


    handleClose: function() {
        this.state.ticket.close();
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
                    user={self.props.user}
                    ticket={self.state.ticket}
                    currentHandlers={_.invoke(self.state.ticket.handlers(), "getUser")}
                    onCancel={close}
                    onSelect={function(users) {
                        close();
                        if (self.isMounted()) self.setState({ fetching: true });

                        Promise.map(users, function(user) {
                            return self.state.ticket.addHandler(user);
                        })
                        .then(function() {
                            return self.fetchTicket();
                        })
                        .catch(captureError("Käsittelijöiden lisääminen epäonnistui"));
                }}/>
            );
        });
    },

    handleOnFocus: function() {
        this.fetchTicket();
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
        return this.state.ticket.markAsRead()
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
        return this.state.ticket.fetch()
            .bind(this)
            .then(function() {
                if (this.isMounted()) this.setState({ fetching: false });
            })
            .catch(captureError("Tukipyynnön tilan päivitys epäonnistui"));
    },



    renderBadge: function() {
        var status = this.state.ticket.getCurrentStatus();
        switch (status) {
            case "open":
                return <Badge className={status}>Ratkaisematon</Badge>;
            case "closed":
                return <Badge className={status}>Ratkaistu</Badge>;
            default:
                return <Badge><Redacted>Unknown</Redacted></Badge>;
        }
    },

    renderDate: function() {
        var datestring = this.state.ticket.get("createdAt"),
        options={weekday: "long", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute:"numeric"};
        return(
            <span className="badge-text">
                <time dateTime={'"' + datestring + '"'} />{" " + new Date(Date.parse(datestring)).toLocaleString('fi', options)}
            </span>
        );
    },

    changeTitle: function(e) {
        this.setState({ changingTitle: true });
        this.state.ticket.addTitle(e.value)
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
        return this.state.ticket.updates().reduce(function(a, next) {
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
        var self = this;
        var ticket = this.state.ticket;
        var fetching = this.state.fetching;
        var user = this.props.user;
        var updates = this.getUpdatesWithMergedComments();

        return (
            <div className="row TicketView">
                <div className="ticket-view col-md-8">

                    <Loading visible={fetching} />

                    <div className="ticket-title ticket-updates">
                        <div className="update-buttons-wrap row">
                            <div className="badges col-md-3">
                                <span className="badge-text">
                                {"Tukipyyntö #" + ticket.get("id") + " "}
                                </span>
                                {this.renderBadge()}
                            </div>
                            <div className="update-buttons col-md-9">
                                {user.isManager() &&
                                    <Button bsStyle="success" onClick={this.handleAddHandler} >
                                        <i className="fa fa-user"></i>Lisää käsittelijä
                                    </Button>
                                }
                                {ticket.isHandler(user) &&
                                    <ToggleStatusButton ticket={ticket} user={user} />
                                }

                                <ToggleFollowButton ticket={ticket} user={user} />
                            </div>
                        </div>
                        <div className="header ticket-header">
                            <EditableText onSubmit={this.changeTitle} disabled={!ticket.isHandler(user)}>
                                <h3>
                                    {ticket.getCurrentTitle() || <Redacted>Ladataan otsikkoa</Redacted>}
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
                                        // Mark the ticket as read 30 seconds
                                        // after the last update has been shown
                                        // to the user
                                        setTimeout(self.lazyMarkAsRead, 10*1000);
                                    }} />
                                </div>
                            );
                        })}
                    </div>

                    <CommentForm onSubmit={this.saveComment} >
                        Lähetä {this.state.saving && <Loading.Spinner />}
                    </CommentForm>

                </div>

                <div className="col-md-4">
                    <SideInfo />
                </div>
            </div>
        );
    },

});

module.exports = TicketView;
