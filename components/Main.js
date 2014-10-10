/** @jsx React.DOM */
"use strict";

var React = require("react/addons");
var Backbone = require("backbone");
var _ = require("lodash");
var Link = require("react-router").Link;
var Modal = require("react-bootstrap/Modal");
var ButtonGroup = require("react-bootstrap/ButtonGroup");

var User = require("app/models/client/User");
var Ticket = require("app/models/client/Ticket");
var Comment = require("app/models/client/Comment");
var BackboneMixin = require("./BackboneMixin");
var ErrorMessage = require("./ErrorMessage");
var UserInformation = require("./UserInformation");
var NotificationsHub = require("./NotificationsHub");
var NotificationBox = require("./NotificationBox");
var BrowserTitle = require("app/utils/BrowserTitle");
var captureError = require("app/utils/captureError");


/**
 * Root React component. The app starts here
 *
 * @namespace components
 * @class Main
 * @extends react.ReactComponent
 * @constructor
 * @param {Object} props
 * @param {Socket.IO} props.io Socket.IO socket
 * @param {BrowserTitle} props.title BrowserTitle instance
 */
var Main = React.createClass({

    mixins: [BackboneMixin],

    propTypes: {
        title: React.PropTypes.instanceOf(BrowserTitle).isRequired,
        user: React.PropTypes.instanceOf(User).isRequired,
        io: React.PropTypes.shape({
            on: React.PropTypes.func.isRequired,
            off: React.PropTypes.func.isRequired
        }).isRequired
    },

    getInitialState: function() {
        return {
            unreadTickets: Ticket.collection({ url: "/api/notifications" }),
            userTickets: Ticket.collection({
                query: {
                    tags: [
                        "handler:" + this.props.user.get("id"),
                        "status:pending|status:open",
                    ]
                }
            }),
            lastUpdate: null
        };
    },

    fetchUnreadTickets: function() {
        return this.state.unreadTickets.fetch()
        .catch(captureError("Ilmoitusten lataaminen epäonnistui"));
    },

    handleFollowerUpdate: function(update) {
        this.fetchUnreadTickets();
        var comment = new Comment(update);
        this.setState({ lastUpdate: comment });
    },

    componentDidMount: function() {
        this.fetchUnreadTickets = _.throttle(this.fetchUnreadTickets, 2000);
        this.fetchUnreadTickets();
        Ticket.on("markedAsRead", this.fetchUnreadTickets);
        window.addEventListener("focus", this.fetchUnreadTickets);
        Backbone.on("error", this.handleUnhandledError);
        this.props.io.on("followerUpdate", this.handleFollowerUpdate);
    },

    componentWillUnmount: function() {
        window.removeEventListener("focus", this.fetchUnreadTickets);
        Backbone.off("error", this.handleUnhandledError);
        this.props.io.off("followerUpdate", this.handleFollowerUpdate);
    },

    handleUnhandledError: function(error, customMessage) {
        console.error(customMessage + ":", error.message);
        if (error.stack) console.error(error.stack);
        this.renderInModal("Uups! Jotain odottamatonta tapahtui :(", function(){
            return <ErrorMessage error={error} customMessage={customMessage} />;
        }, function() {
            window.scrollTo(0, 0);
        });
    },


    /**
     * @method renderInModal
     * @param {String} title
     * @param {Function} renderModalContent
     *      Function returning a React component
     * @param {Function} renderModalContent.close
     *      Call this function to close the modal window
     */
    renderInModal: function(title, render, cb) {
        var self = this;
        this.setState({ renderModalContent: function() {
            return (
                <Modal
                    onRequestHide={function(){}}
                    title={title} >
                    {render(self.closeModal)}
                </Modal>
            );
        } }, cb);
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
                    params={{id: comment.get("ticketId") }}
                    query={{scrollTo: "firstUnread" }}>
                    <b>{creator.getFullName()}</b> lisäsi kommentin <b>{commentString}</b> tukipyyntöön <b>{ticket.getCurrentTitle()}</b>
                </Link>
            </NotificationBox>
        );
    },

    render: function() {
        var user = this.props.user;
        var unreadTickets = this.state.unreadTickets;
        this.props.title.setNotificationCount(unreadTickets.size());
        this.props.title.activateOnNextTick();

        return (
            <div className="Main">

                {this.state.lastUpdate && this.renderNotificationBox()}

                <div className="wrapper container-fluid">
                    <h1 className="site-header"><a href="/">Opinsys tukipalvelu</a></h1>
                    {this.state.renderModalContent && this.state.renderModalContent()}
                    <div className="topmenu row">

                        <div className="user-info pull-right">
                            <UserInformation user={user} />
                        </div>

                        <ButtonGroup className="top-buttons">
                            <Link className="btn btn-default top-button" to="new">
                                <i className="fa fa-pencil-square-o"></i>Uusi tukipyyntö
                            </Link>

                            <Link className="btn btn-default top-button" to="tickets">
                                <i className="fa fa-home"></i>Omat tukipyynnöt
                            </Link>
                            <NotificationsHub user={user} tickets={unreadTickets} className="top-button" />
                        </ButtonGroup>
                    </div>

                    <div className="main-wrap clearfix" >
                        <div className="main-content">

                            <this.props.activeRouteHandler
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
