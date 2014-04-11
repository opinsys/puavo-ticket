/** @jsx React.DOM */
"use strict";
var React = require("react/addons");

var Lightbox = require("./Lightbox");
var SimilarTickets = require("./SimilarTickets");

var Ticket = require("../models/client/Ticket");
var routes = require("./routes");
var LinkTicket = routes.LinkTicket;
var LinkNewTicket = routes.LinkNewTicket;
var LinkTicketList = routes.LinkTicketList;
var EventMixin = require("../EventMixin");


/**
 * Edit form for a ticket
 *
 * @namespace components
 * @class TicketForm
 * @extends React.ReactComponent
 * @uses components.EventMixin
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
        this.reactTo(this.state.ticketModel);
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
        }

        if (routes.newTicket.match) {
            this.state.ticketModel.clear();
            this.state.ticketModel.set(this.state.ticketModel.defaults());
        }
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

    render: function() {
        console.log("render TickerForm");
        return (
            <div>

                {routes.existingTicket.match &&
                    <LinkNewTicket>Uusi tukipyyntö</LinkNewTicket>}

                <LinkTicketList>Näytä muut</LinkTicketList>


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
                        disabled={this.isOperating()}
                        onClick={this.handleSave} >Tallenna</button>
                </div>


            </div>
        );
    },


});

module.exports = TicketForm;
