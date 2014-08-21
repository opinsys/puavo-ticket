/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
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
var Loading = require("../Loading");
var SelectUsers = require("../SelectUsers");
var SideInfo = require("../SideInfo");
var Redacted = require("../Redacted");
var EditableText = require("../EditableText");

var ToggleTagsButton = require("./ToggleTagsButton");
var ToggleStatusButton = require("./ToggleStatusButton");
var ToggleFollowButton = require("./ToggleFollowButton");
var CommentUpdate = require("./CommentUpdate");


// Individual components for each ticket update type
var UPDATE_COMPONENTS = {
    comments: CommentUpdate.fromUpdate,
    tags: require("./TagUpdate"),
    handlers: require("./HandlerUpdate"),
    titles: require("./TitleUpdate")
};



/**
 * TicketView
 *
 * @namespace components
 * @class TicketView
 */
var TicketView = React.createClass({

    mixins: [BackboneMixin],

    getInitialState: function() {
        return {
            ticket: new Ticket({ id: this.props.params.id }),
            fetching: true,
            saving: false,
            showTags: true,
        };
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
        if (this._scrolled) return;

        var el = document.getElementById(window.location.hash.slice(1));
        // Element not rendered yet - or it just does not exists
        if (!el) return;

        el.scrollIntoView();
        this._scrolled = true;
    },

    componentDidUpdate: function() {
        this.scrollToAnchoredElement();
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


    componentDidMount: function() {
        this.fetchTicket();
        window.addEventListener("focus", this.handleOnFocus);

        /**
         * Lazy version of the `markAsRead()` method. It will mark the ticket
         * as read at max once in 10 seconds
         *
         * @method lazyMarkAsRead
         */
        this.lazyMarkAsRead = _.throttle(this.markAsRead, 10*1000);
    },

    componentWillUnmount: function() {
        window.removeEventListener("focus", this.handleOnFocus);
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
        this.setState({ fetching: true });
        this.state.ticket.addTitle(e.value)
        .delay(2000)
        .bind(this)
        .then(function() {
            if (!this.isMounted()) return;
            this.setState({ fetching: false });
            this.fetchTicket();
        })
        .catch(captureError("Otsikon päivitys epäonnistui"));
    },


    render: function() {
        var self = this;
        var ticket = this.state.ticket;
        var fetching = this.state.fetching;
        var user = this.props.user;
        var updates = this.state.ticket.updates().filter(function(update) {
            if (!self.state.showTags && update.get("type") === "tags") {
                return false;
            }

            return true;
        });

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
                                {user.isManager() &&
                                    <ToggleTagsButton active={this.state.showTags} onClick={this.toggleTags} />
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
                                <div key={update.get("unique_id")} className={className}>
                                    <UpdateComponent update={update} onViewport={function(props) {
                                        if (_.last(updates) !== props.update) return;
                                        // Mark the ticket as read 30 seconds
                                        // after the last update has been shown
                                        // to the user
                                        setTimeout(self.lazyMarkAsRead, 30*1000);
                                    }} />
                                </div>
                            );
                        })}
                    </div>

                    <CommentForm onSubmit={this.saveComment} >
                        Lähetä {this.state.saving && <Loading.Spinner />}
                    </CommentForm>

                </div>

                <div className="sidebar col-md-4">
                    <SideInfo />
                </div>
            </div>
        );
    },

});

module.exports = TicketView;
