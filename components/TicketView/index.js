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
var Base = require("../../models/client/Base");
var SelectUsers = require("../SelectUsers");
var SideInfo = require("../SideInfo");
var Redacted = require("../Redacted");
var ProfileBadge = require("../ProfileBadge");
var OnViewportMixin = require("../OnViewportMixin");
var TimeAgo = require("../TimeAgo");

var ToggleTagsButton = require("./ToggleTagsButton");
var ToggleStatusButton = require("./ToggleStatusButton");


var supportPerson = {
    getFullname: function() {
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
                                {"Tiketti #" + this.state.ticket.get("id") + " "}
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
                                    {this.state.ticket.createdBy().getName() || <Redacted>Matti Meikäläinen</Redacted>}
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
                        var View = VIEW_TYPES[update.get("type")];

                        if (!View) {
                            console.error("Unknown update type: " + update.get("type"));
                            return;
                        }

                        var className = classSet({
                            unread: update.isUnreadBy(self.props.user)
                        });

                        return (
                            <div key={update.get("unique_id")} className={className}>
                                <View update={update} onViewport={function(props) {
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



/**
 * Common functionality for each ticket update component
 *
 * @namespace components
 * @class TicketView.UpdateMixin
 */
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
        mixins: [UpdateMixin, OnViewportMixin],
        render: function() {
            return (
                <div className="ticket-updates comments">
                    <div className="image">
                        <ProfileBadge user={this.props.update.createdBy()} />
                    </div>
                    <div className="message">
                        <strong>{this.props.update.createdBy().getName()} <br/></strong>
                        <span>
                            {this.props.update.get("comment").trim().split("\n").map(function(line) {
                                return <span>{line}<br /></span>;
                            })}
                        </span>
                        <TimeAgo date={this.props.update.createdAt()} />
                    </div>
                </div>
            );
        },
    }),

    tags: React.createClass({
        mixins: [UpdateMixin, OnViewportMixin],
        render: function() {
            return (
                <div className="tags">
                    <i>{this.getCreatorName()} lisäsi tagin: </i>
                    <span>{this.props.update.get("tag")}</span>
                </div>
            );
        },
    }),

    handlers: React.createClass({
        mixins: [UpdateMixin, OnViewportMixin],
        render: function() {
            return (
                <div className="tags">
                    <i>{this.getCreatorName()} lisäsi käsittelijäksi käyttäjän </i>
                    <span>{this.props.update.get("handler").externalData.username}</span>
                </div>
            );
        },
    })
};


module.exports = TicketView;
