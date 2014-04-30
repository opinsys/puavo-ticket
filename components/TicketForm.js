/** @jsx React.DOM */
"use strict";
var React = require("react/addons");

var Lightbox = require("./Lightbox");
var SimilarTickets = require("./SimilarTickets");
var AddDevice = require("./AddDevice");

var Ticket = require("../models/client/Ticket");
var routes = require("./routes");
var LinkTicket = routes.LinkTicket;
var EventMixin = require("../utils/EventMixin");
var Comment = require("../models/client/Comment");


/**
 * Edit form for a ticket
 *
 * @namespace components
 * @class TicketForm
 * @extends React.ReactComponent
 * @uses utils.EventMixin
 */
var TicketForm = React.createClass({

    mixins: [EventMixin],

    getInitialState: function() {
        return {
            ticketModel: new Ticket()
        };
    },

    componentWillMount: function() {
        console.log("setup model from mount");
        this.setupModel();
    },

    componentWillReceiveProps: function() {
        console.log("setup model from props");
        this.setupModel();
    },

    handleChange: function() {
        this.state.ticketModel.set({
            description: this.refs.description.getDOMNode().value,
            title: this.refs.title.getDOMNode().value,
        });
    },

    saveComment: function() {
        var comment = new Comment({
            comment: this.refs.comment.getDOMNode().value
        });

        this.state.ticketModel.updates().add(comment);

        var self = this;
        return comment.save()
            .then(function() {
                self.refs.comment.getDOMNode().value = "";
            });
    },

    isOperating: function() {
        return this.state.ticketModel.isOperating();
    },

    /**
     * Fetch model from the rest api if viewing existing ticket otherwise just
     * clear the model for new tickets
     *
     * @method setupModel
     */
    setupModel: function() {
        if (routes.existingTicket.match) {
            this.state.ticketModel.set({ id: routes.existingTicket.match.params.id });
            this.state.ticketModel.fetch();
            this.state.ticketModel.updates().fetch();
        }

        if (routes.newTicket.match) {
            this.state.ticketModel.reset();
        }

        this.reactTo(this.state.ticketModel);
    },

    /**
     * @method handleSave
     */
    handleSave: function() {
        var self = this;
        this.state.ticketModel.save().then(function(foo) {
            if (routes.existingTicket.match) return;

            LinkTicket.navigate({ id: self.state.ticketModel.get("id") });
            Lightbox.displayComponent(
                <div>
                    <h1>Tukipyyntö tallennettu!</h1>
                    <p>Nopeuttaaksesi tukipyynnön käsittelyä on erittäin suositeltua lisätä tarkentavia tietoja.</p>
                    {/* <MetadataButtons ticketModel={self.state.ticketModel} /> */}
                    <button onClick={Lightbox.removeCurrentComponent}>
                        Myöhemmin
                    </button>
                </div>
            );

        });
    },

    /**
     * @method renderSimilarTickets
     */
    renderSimilarTickets: function() {
        if (routes.newTicket.match) {
            return <SimilarTickets ticketModel={this.state.ticketModel} />;
        }
    },

    handleAddDevice: function(e) {
        Lightbox.displayComponent(
            <AddDevice ticketModel={this.state.ticketModel} />
        );
    },

    render: function() {
        console.log("render TickerForm: updates: ", this.state.ticketModel.updates().size());
        return (
            <div className="ticket-form">

                {this.isOperating() && <p>Ladataan...</p>}

                {this.renderSimilarTickets()}

                <input
                    disabled={this.isOperating()}
                    autoFocus
                    ref="title"
                    type="text"
                    onChange={this.handleChange}
                    value={this.state.ticketModel.get("title")}
                    placeholder="Otsikko" />
                <textarea
                    disabled={this.isOperating()}
                    ref="description"
                    placeholder="Kuvaus ongelmastasi"
                    value={this.state.ticketModel.get("description")}
                    onChange={this.handleChange}
                />

                <div className="button-wrap">
                    <button
                        className="button"
                        disabled={this.isOperating()}
                        onClick={this.handleSave} >Tallenna</button>
                </div>


                {routes.existingTicket.match &&
                <div>
                    <ul>
                        {this.state.ticketModel.updates().map(function(update) {
                            var out;

                            if (update.get("type") === "devices") {
                                out = "Laite " + update.get("hostname");
                            }
                            else {
                                out = update.get("comment");
                            }

                            var user = update.get("createdBy");
                            if (user) {
                                out += ". Lähetti " + user.username;
                            }

                            if (update.saving) {
                                out  += " (saving...)";
                            }

                            return <li>{out}</li>;
                        })}
                    </ul>
                    <input ref="comment" type="text" />
                    <button onClick={this.saveComment}>Lähetä</button>
                    <button onClick={this.handleAddDevice} >Add device</button>
                </div>
                }


            </div>
        );
    },


});

module.exports = TicketForm;
