/** @jsx React.DOM */
var React = require("react/addons");

var Lightbox = require("./Lightbox");
var SimilarTickets = require("./SimilarTickets");
var ListenToMixin = require("../ListenToMixin");

var Ticket = require("../models/client/Ticket");
var routes = require("./routes");
var LinkTicket = routes.LinkTicket;
var LinkNewTicket = routes.LinkNewTicket;
var LinkTicketList = routes.LinkTicketList;

var TicketForm = React.createClass({

    mixins: [ListenToMixin],

    getInitialState: function() {
        return {};
    },

    componentWillMount: function() {
        this.fetchTicket();
    },

    componentWillReceiveProps: function() {
        this.fetchTicket();
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

    fetchTicket: function() {
        var model = this.state.ticketModel;

        if (!model || routes.newTicket.match) {
            model = new Ticket();

            var self = this;
            this.stopListening();

            this.listenTo(model, "all", function(e) {
                self.forceUpdate();
            });

            this.setState({ ticketModel: model });
        }

        if (routes.existingTicket.match) {
            model.set({ id: routes.existingTicket.match.params.id });
            model.fetch();
        }
    },


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

    renderSimilarTickets: function() {
        if (routes.newTicket.match) {
            return <SimilarTickets ticketModel={this.state.ticketModel} />;
        }
    },

    render: function() {

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
