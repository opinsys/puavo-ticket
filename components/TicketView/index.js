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
var ProfileBadge = require("../ProfileBadge");

var ToggleTagsButton = require("./ToggleTagsButton");
var ToggleStatusButton = require("./ToggleStatusButton");


// Individual components for each ticket update type
var UPDATE_COMPONENTS = {
    comments: require("./CommentUpdate"),
    tags: require("./TagUpdate"),
    handlers: require("./HandlerUpdate")
};

// Mock user object for the first automated message user receives after sending
// a ticket
var supportPerson = {
    getFullName: function() {
        return "Opinsys Oy";
    },

    getProfileImage: function() {
        return "/images/support_person.png";
    }
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
                    currentHandlers={_.invoke(self.state.ticket.handlers(), "getHandlerUser")}
                    onCancel={close}
                    onSelect={function(users) {
                        close();
                        if (self.isMounted()) self.setState({ fetching: true });

                        Promise.all(users.map(function(user) {
                            return self.state.ticket.addHandler(user);
                        }))
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


    render: function() {
        var self = this;
        var updates = this.state.ticket.updates().filter(function(update) {
            if (!self.state.showTags && update.get("type") === "tags") {
                return false;
            }

            return true;
        });
        return (
            <div className="row TicketView">
                <div className="ticket-view col-md-8">

                    <Loading visible={this.state.fetching} />

                    <div className="ticket-title ticket-updates">
                        <div className="update-buttons-wrap row">
                            <div className="badges col-md-3">
                                <span className="badge-text">
                                {"Tukipyyntö #" + this.state.ticket.get("id") + " "}
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
                                {this.state.ticket.isHandler(this.props.user) &&
                                    <ToggleStatusButton ticket={this.state.ticket} user={this.props.user} />
                                }
                            </div>
                        </div>
                        <div className="header ticket-header">
                            <h3>
                                {this.state.ticket.getCurrentTitle() || <Redacted>Ladataan otsikkoa</Redacted>}
                            </h3>
                            {this.renderDate()}
                        </div>
                        <div className="image">
                            <ProfileBadge user={this.state.ticket.createdBy()} />
                        </div>
                        <div className="message">
                             <span>
                                <strong>
                                    {this.state.ticket.createdBy().getFullName() || <Redacted>Matti Meikäläinen</Redacted>}
                                </strong>
                            </span><br />
                            <span>
                                {this.state.ticket.get("description") || <Redacted ipsum />}
                            </span>
                        </div>
                    </div>

                    <div className="ticket-updates comments">
                        <div className="image">
                            <ProfileBadge user={supportPerson} />
                        </div>
                        <div className="message">
                            <strong>Opinsys tuki <br/></strong>
                            <span>Olemme vastaanottaneet tukipyyntösi. Voit halutessasi täydentää sitä.</span>
                        </div>
                    </div>
                    <div>
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
