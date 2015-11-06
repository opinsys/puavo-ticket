"use strict";

var React = require("react");
var Link = require("react-router").Link;
var RouteHandler = require("react-router").RouteHandler;
var ButtonGroup = require("react-bootstrap/lib/ButtonGroup");
var Reflux = require("reflux");
var Modal = require("react-bootstrap/lib/Modal");

var app = require("../index");
var Actions = require("../Actions");
var Ticket = require("../models/client/Ticket");
var Comment = require("../models/client/Comment");
var BackboneMixin = require("./BackboneMixin");
var ErrorMessage = require("./ErrorMessage");
var UserInformation = require("./UserInformation");
var NotificationsHub = require("./NotificationsHub");
var NotificationBox = require("./NotificationBox");
var AjaxNotification = require("./AjaxNotification");



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

    mixins: [
        BackboneMixin,
        Reflux.listenTo(Actions.error.display, "handleUnhandledError")
    ],

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
        app.handleUnhandledError = this.handleUnhandledError;
    },


    handleFollowerUpdate: function(update) {
        var comment = new Comment(update);
        this.setState({ lastUpdate: comment });
        Actions.refresh();
    },

    componentDidMount: function() {
        Ticket.on("markedAsRead", this.throttledFetchUnreadTickets);
        window.addEventListener("focus", this.throttledFetchUnreadTickets);
        app.io.on("followerUpdate", this.handleFollowerUpdate);
    },

    componentWillUnmount: function() {
        window.removeEventListener("focus", this.throttledFetchUnreadTickets);
        app.io.off("followerUpdate", this.handleFollowerUpdate);
    },

    renderFatalError: function() {
        var error = this.state.error;
        return (
            <Modal show>
                <Modal.Header closeButton>
                    <Modal.Title style={{color: "red"}}>Odottomaton virhe!</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <ErrorMessage error={error.error} customMessage={error.message} />
                </Modal.Body>
            </Modal>
        );
    },

    handleUnhandledError: function(error) {
        console.error(error.message + ":", error.message);
        if (error.stack) console.error(error.stack);
        this.setState({error});
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

        return (
            <div className="Main">
                <AjaxNotification />

                {this.state.lastUpdate && this.renderNotificationBox()}

                <div className="wrapper container-fluid">
                    <h1 className="site-header">
                        <a href="/">Opinsys tukipalvelu</a>
                    </h1>

                    {this.state.error && this.renderFatalError()}

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
                            <NotificationsHub className="top-button" />
                        </ButtonGroup>
                    </div>

                    <div className="main-wrap clearfix" >
                        <div className="main-content">

                            <RouteHandler
                                params={self.props.params}
                                query={self.props.query}
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
