/** @jsx React.DOM */
"use strict";

var React = require("react/addons");
var Backbone = require("backbone");
var _ = require("lodash");
var Link = require("react-router").Link;
var RouteHandler = require("react-router").RouteHandler;
var ButtonGroup = require("react-bootstrap/ButtonGroup");
var Promise = require("bluebird");

var app = require("app");
var Ticket = require("app/models/client/Ticket");
var Comment = require("app/models/client/Comment");
var Modal = require("./Modal");
var BackboneMixin = require("./BackboneMixin");
var ErrorMessage = require("./ErrorMessage");
var UserInformation = require("./UserInformation");
var NotificationsHub = require("./NotificationsHub");
var NotificationBox = require("./NotificationBox");
var captureError = require("app/utils/captureError");



/**
 * Root React component. The app starts here
 *
 * @namespace components
 * @class Main
 * @extends react.ReactComponent
 * @constructor
 * @param {Object} props
 */
var Main = React.createClass({

    mixins: [BackboneMixin],


    getInitialState: function() {
        return {
            unreadTickets: Ticket.collection([], { url: "/api/notifications" }),
            userTickets: Ticket.collection([], {
                query: {
                    follower: app.currentUser.get("id"),
                    tags: [
                        "status:pending|status:open",
                    ]
                }
            }),
            lastUpdate: null
        };
    },

    componentWillMount: function() {
        if (app.currentUser.acl.canSeePendingTickets()) {
            this.setBackbone({
                pendingTickets: Ticket.collection([], {
                    query: { tags: ["status:pending"] }
                })
            });
        }
    },

    fetchUnreadTickets: function() {
        var ops = [this.state.unreadTickets.fetch()];
        if (this.state.pendingTickets) {
            ops.push(this.state.pendingTickets.fetch());
        }
        return Promise.all(ops)
        .catch(captureError("Ilmoitusten lataaminen epäonnistui"));
    },

    handleFollowerUpdate: function(update) {
        this.fetchUnreadTickets();
        var comment = new Comment(update);
        this.setState({ lastUpdate: comment });
    },

    componentDidMount: function() {
        process.nextTick(this.fetchUnreadTickets);
        this.throttledFetchUnreadTickets = _.throttle(this.fetchUnreadTickets, 2000);
        Ticket.on("markedAsRead", this.throttledFetchUnreadTickets);
        window.addEventListener("focus", this.throttledFetchUnreadTickets);
        Backbone.on("error", this.handleUnhandledError);
        app.io.on("followerUpdate", this.handleFollowerUpdate);
        app.renderInModal = this.renderInModal;
        app.closeModal = this.closeModal;
    },

    componentWillUnmount: function() {
        window.removeEventListener("focus", this.throttledFetchUnreadTickets);
        Backbone.off("error", this.handleUnhandledError);
        app.io.off("followerUpdate", this.handleFollowerUpdate);
    },

    displayLogoutError: function() {
        this.renderInModal({
            title: "Uups! Jotain odottamatonta tapahtui :(",
            permanent: true
        }, function() {
            // TODO proper padding
            return (
                <p>
                    Istuntosi on vanhentunut tai olet kirjautunut ulos toisessa
                    ikkunassa. <a href="">Kirjaudu uudestaan</a> jatkaaksesi.
                </p>
            );
        });
    },

    handleUnhandledError: function(error, customMessage) {
        if (error && error.data && error.data.code === "NOAUTH") {
            return this.displayLogoutError();
        }

        console.error(customMessage + ":", error.message);
        if (error.stack) console.error(error.stack);
        this.renderInModal({
            title: "Uups! Jotain odottamatonta tapahtui :(",
            permanent: true
        }, function(){
            return <ErrorMessage error={error} customMessage={customMessage} />;
        });
    },


    /**
     * @method renderInModal
     * @param {Object} options
     * @param {Object} options.title
     * @param {Function} renderModalContent
     *      Function returning a React component
     * @param {Function} renderModalContent.close
     *      Call this function to close the modal window
     */
    renderInModal: function(options, render, cb) {
        var self = this;
        if (typeof options === "string") {
            options = {title: options};
        }

        this.setState({ renderModalContent: function() {
            return (
                <Modal
                    onRequestHide={self.closeModal}
                    permanent={!!options.permanent}
                    title={options.title} >
                    {render(self.closeModal)}
                </Modal>
            );
        }}, cb);
    },

    closeModal: function(e) {
        this.setState({ renderModalContent: null });
    },

    /**
     * Remove the NotificationBox from the the view
     *
     * @method dismissNotificationBox
     */
    dismissNotificationBox: function() {
        this.setState({ lastUpdate: null });
    },

    renderNotificationBox: function() {
        var comment = this.state.lastUpdate;
        var ticket = comment.ticket();
        var creator = comment.createdBy();
        var commentString = comment.get("comment");
        if (commentString.length > 100) {
            commentString = commentString.slice(0, 100) + "...";
        }
        return (
            <NotificationBox onDismiss={this.dismissNotificationBox} timeout={1000*10}>
                <Link to="ticket"
                    onClick={this.dismissNotificationBox}
                    params={{id: comment.get("ticketId") }}>
                    <b>{creator.getFullName()}</b> lisäsi kommentin <b>{commentString}</b> tukipyyntöön <b>{ticket.getCurrentTitle()}</b>
                </Link>
            </NotificationBox>
        );
    },

    render: function() {
        var self = this;
        var unreadTickets = this.state.unreadTickets;
        var pendingTickets = this.state.pendingTickets;

        return (
            <div className="Main">

                {this.state.lastUpdate && this.renderNotificationBox()}

                <div className="wrapper container-fluid">
                    <h1 className="site-header"><a href="/">Opinsys tukipalvelu</a></h1>
                    {this.state.renderModalContent && this.state.renderModalContent()}
                    <div className="topmenu row">

                        <div className="user-info pull-right">
                            <UserInformation user={app.currentUser} />
                        </div>

                        <ButtonGroup className="top-buttons">
                            <Link className="btn btn-default top-button Main-new-ticket" to="new">
                                <i className="fa fa-pencil-square-o"></i>Uusi tukipyyntö
                            </Link>

                            <Link className="btn btn-default top-button" to="tickets">
                                <i className="fa fa-home"></i>Listaa
                            </Link>
                            <NotificationsHub title={this.props.title} className="top-button" >
                                <NotificationsHub.TicketGroup title="Tukipyynnöt joissa on lukemattomia päivityksiä" tickets={unreadTickets}  />
                                {pendingTickets &&
                                    <NotificationsHub.TicketGroup title="Tukipyynnöt jotka odottavat käsittelijää" tickets={pendingTickets}  />}
                            </NotificationsHub>
                        </ButtonGroup>
                    </div>

                    <div className="main-wrap clearfix" >
                        <div className="main-content">

                            <RouteHandler
                                params={self.props.params}
                                query={self.props.query}
                                renderInModal={this.renderInModal}
                                userTickets={this.state.userTickets}
                                user={this.props.user} />
                        </div>

                    </div>
                </div>
            </div>
        );
    }

});

module.exports = Main;
