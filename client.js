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
var SideInfo = require("./components/SideInfo");
var ErrorMessage = require("./components/ErrorMessage");
var Lightbox = require("./components/Lightbox");

var navigation = require("./components/navigation");
var route = navigation.route;

var LogoutLink = navigation.link.LogoutLink;
var RootLink = navigation.link.RootLink;
var NewTicketLink = navigation.link.NewTicketLink;
var TicketViewLink = navigation.link.TicketViewLink;


/**
 * User information and logout
 *
 * @namespace components
 * @class UserInformation
 */
var UserInformation = React.createClass({
    render: function() {
        return (
            <div className="user">
                <ul>
                    <li>
                        {this.props.user.get("external_data").first_name} {this.props.user.get("external_data").last_name}
                    </li>
                    <li>
                        <img src={this.props.user.getProfileImage()} />
                    </li>
                    <li>
                        <LogoutLink pushState={false}>Kirjaudu ulos</LogoutLink>
                    </li>
                </ul>
            </div>
        );
    }
});


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


    render: function() {
        return (
            <div>
                <div className="topmenu">
                    <button onClick={NewTicketLink.go} className="top-button" >Uusi tukipyyntö</button>
                    <button onClick={RootLink.go} className="top-button" >Omat tukipyynnöt</button>

                    <UserInformation user={this.state.user} />
                </div>

                <div className="main-wrap clearfix" >
                    <div className="main">

            {/*<h1>Tukipalvelu</h1>*/}

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
                                ticket={this.state.ticket}
                                user={this.state.user}
                            />
                        }

                    </div>
                        <div className="sidebar">
                           <SideInfo>
                            </SideInfo>
                        </div>
                </div>
            </div>
        );
    }

});

React.renderComponent(<Main />, document.getElementById("app"));

Backbone.on("error", function(error) {
    console.error("Unhandled error", error);
    Lightbox.displayComponent(<ErrorMessage error={error} />);
});

window.onerror = function(message, url, linenum) {
    Lightbox.displayComponent(<ErrorMessage error={{
        message: message + " on " + url + ":" + linenum
    }} />);
};

