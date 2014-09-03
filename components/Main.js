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
var BackboneMixin = require("./BackboneMixin");
var ErrorMessage = require("./ErrorMessage");
var UserInformation = require("./UserInformation");
var NotificationsHub = require("./NotificationsHub");


/**
 * Root React component. The app starts here
 *
 * @namespace components
 * @class Main
 * @extends react.ReactComponent
 * @constructor
 * @param {Object} props
 * @param {Socket.IO} props.io Socket.IO socket
 */
var Main = React.createClass({

    mixins: [BackboneMixin],

    propTypes: {
        io: React.PropTypes.shape({
            on: React.PropTypes.func.isRequired,
            off: React.PropTypes.func.isRequired
        }).isRequired
    },

    getInitialState: function() {
        return {
            user: new User(window.USER),
            unreadTickets: Ticket.collection()
        };
    },

    fetchUnreadTickets: function() {
        return this.state.unreadTickets.fetchWithUnreadComments();
    },

    componentDidMount: function() {
        this.fetchUnreadTickets = _.throttle(this.fetchUnreadTickets, 2000);
        this.fetchUnreadTickets();
        Ticket.on("markedAsRead", this.fetchUnreadTickets);
        window.addEventListener("focus", this.fetchUnreadTickets);
        Backbone.on("error", this.handleUnhandledError);
        this.props.io.on("followerUpdate", this.fetchUnreadTickets);
    },

    componentWillUnmount: function() {
        window.removeEventListener("focus", this.fetchUnreadTickets);
        Backbone.off("error", this.handleUnhandledError);
        this.props.io.off("followerUpdate", this.fetchUnreadTickets);
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

    render: function() {
        var user = this.state.user;
        var unreadTickets = this.state.unreadTickets;

        return (
            <div className="Main wrapper container-fluid">
                <h1 className="site-header">Opinsys tukipalvelu</h1>
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
                            unreadTickets={unreadTickets}
                            user={this.state.user} />

                    </div>

                </div>
            </div>
        );
    }

});

module.exports = Main;
