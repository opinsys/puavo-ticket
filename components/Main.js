/** @jsx React.DOM */
"use strict";

var React = require("react/addons");
var Backbone = require("backbone");
var Link = require("react-router").Link;
var Modal = require("react-bootstrap/Modal");
var ButtonGroup = require("react-bootstrap/ButtonGroup");

var User = require("../models/client/User");
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
 */
var Main = React.createClass({

    mixins: [BackboneMixin],

    getInitialState: function() {
        return {
            user: new User(window.USER),
            ticket: null
        };
    },

    componentDidMount: function() {
        Backbone.on("error", this.handleUnhandledError);
    },

    componentWillUnmount: function() {
        Backbone.off("error", this.handleUnhandledError);
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
        return (
            <div className="Main wrapper container-fluid">
                <h1 className="site-header">Opinsys tukipalvelu</h1>
                {this.state.renderModalContent && this.state.renderModalContent()}
                <div className="topmenu row">

                    <div className="user-info pull-right">
                        <UserInformation user={this.state.user} />
                    </div>

                    <ButtonGroup className="top-buttons">
                        <Link className="btn btn-default top-button" to="new">
                            <i className="fa fa-pencil-square-o"></i>Uusi tukipyyntö
                        </Link>

                        <Link className="btn btn-default top-button" to="tickets">
                            <i className="fa fa-home"></i>Omat tukipyynnöt
                        </Link>
                        <NotificationsHub user={this.state.user} className="top-button" />
                    </ButtonGroup>
                </div>

                <div className="main-wrap clearfix" >
                    <div className="main-content">

                        <this.props.activeRouteHandler
                            renderInModal={this.renderInModal}
                            user={this.state.user} />

                    </div>

                </div>
            </div>
        );
    }

});

module.exports = Main;
