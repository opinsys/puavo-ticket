/** @jsx React.DOM */
"use strict";
require("./client_setup");

var React = require("react/addons");
var Backbone = require("backbone");

var UpdateMixin = require("./components/UpdateMixin");
var User = require("./models/client/User");
var Ticket = require("./models/client/Ticket");

var TicketForm = require("./components/TicketForm");
var TicketView = require("./components/TicketView");
var TicketList = require("./components/TicketList");
var ErrorMessage = require("./components/ErrorMessage");
var UserInformation = require("./components/UserInformation");

var Button = require("react-bootstrap/Button");
var Modal = require("react-bootstrap/Modal");

var navigation = require("./components/navigation");
var route = navigation.route;

var RootLink = navigation.link.RootLink;
var NewTicketLink = navigation.link.NewTicketLink;
var TicketViewLink = navigation.link.TicketViewLink;



/**
 * Root React component. The app starts here
 *
 * @namespace components
 * @class Main
 * @extends react.ReactComponent
 */
var Main = React.createClass({

    mixins: [UpdateMixin],

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

    handleUnhandledError: function(error) {
        this.renderInModal("Uups. Jotain odottamatonta tapahtui", function(){
            return <ErrorMessage error={error} />;
        });
    },

    /**
     * Return true if the current ticket has the id
     *
     * @method
     * @param {String} id
     * @return {Boolean}
     */
    hasTicket: function(id) {
        if (!this.state.ticket) return false;
        return String(this.state.ticket.get("id")) === String(id);
    },

    onNavigate: function() {
        var existing = route.ticket.existing;

        if (route.root.isMatch()) {
            this.setState({ ticket: null });
            return;
        }

        if (route.ticket.newForm.isMatch()) {
            this.setTicket(new Ticket());
            return;
        }

        if (existing.isMatch()) {
            var id = existing.get("id");
            if (!this.hasTicket(id)) {
                this.setTicket(new Ticket({ id: id }));
                return;
            }
        }

        this.forceUpdate();
    },

    setTicket: function(ticket) {
        if (typeof ticket.get !== "function") throw new Error("Bad ticket");
        if (ticket.get("id")){
            ticket.fetch().catch(Backbone.trigger.bind(Backbone, "error"));
        }
        this.setState({ ticket: ticket });
    },

    handleSelectTicket: function(ticket) {
        this.setTicket(ticket);
        TicketViewLink.go({ id: ticket.get("id") });
    },

    /**
     * @method renderInModal
     * @param {String} title
     * @param {Function} renderModalContent
     *      Function returning a React component
     * @param {Function} renderModalContent.close
     *      Call this function to close the modal window
     */
    renderInModal: function(title, render) {
        var self = this;
        this.setState({ renderModalContent: function() {
            return (
                <Modal title={title} onRequestHide={self.closeModal}>
                    {render(self.closeModal)}
                </Modal>
            );
        } });
    },

    closeModal: function() {
        this.setState({ renderModalContent: null });
    },

    render: function() {
        return (
            <div>
                <h1>Opinsys tukipalvelu</h1>
                {this.state.renderModalContent && this.state.renderModalContent()}
                <div className="topmenu">
                    <UserInformation user={this.state.user} />
                    <Button onClick={NewTicketLink.go} className="pure-button pure-button-primary top-button" >Uusi tukipyyntö</Button>
                    <Button onClick={RootLink.go} className="top-button" >Omat tukipyynnöt</Button>
                </div>

                <div className="main-wrap clearfix" >
                    <div className="main">

                        {route.root.isMatch() &&
                            <TicketList
                                user={this.state.user}
                                onSelect={this.handleSelectTicket} />
                        }

                        {route.ticket.newForm.isMatch() &&
                            <TicketForm
                                onSaved={this.handleSelectTicket}
                                ticket={this.state.ticket} />
                        }

                        {route.ticket.existing.isMatch() &&
                            <TicketView
                                renderInModal={this.renderInModal}
                                ticket={this.state.ticket}
                                user={this.state.user}
                            />
                        }

                    </div>

                </div>
            </div>
        );
    }

});

React.renderComponent(<Main />, document.body);

window.onerror = function(message, url, linenum) {
    var msg = "Unhandled client Javascript error: '" + message + "' on " + url + ":" + linenum;
    Backbone.trigger("error", new Error(msg));
};

