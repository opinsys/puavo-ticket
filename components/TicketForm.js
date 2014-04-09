/** @jsx React.DOM */
var React = require("react/addons");

var Lightbox = require("./Lightbox");
var SimilarTickets = require("./SimilarTickets");

var routes = require("./routes");
var LinkTicket = routes.LinkTicket;

var TicketForm = React.createClass({

    handleChange: function() {
        this.props.ticketModel.set({
            description: this.refs.description.getDOMNode().value,
            title: this.refs.title.getDOMNode().value,
        });
    },

    isOperating: function() {
        return this.props.ticketModel.isOperating();
    },

    componentWillMount: function() {
        if (routes.existingTicket.match) {
            this.props.ticketModel.set({ id: routes.existingTicket.match.params.id });
            this.props.ticketModel.fetch();
        }
    },

    handleSave: function() {
        var self = this;
        this.props.ticketModel.save().then(function(foo) {
            if (routes.existingTicket.match) return;

            LinkTicket.navigate({ id: self.props.ticketModel.get("id") });
            Lightbox.displayComponent(
                <div>
                    <h1>Tukipyyntö tallennettu!</h1>
                    <p>Nopeuttaaksesi tukipyynnön käsittelyä on erittäin suositeltua lisätä tarkentavia tietoja.</p>
                    {/* <MetadataButtons ticketModel={self.props.ticketModel} /> */}
                    <button onClick={Lightbox.removeCurrentComponent}>
                        Myöhemmin
                    </button>
                </div>
            );

        });
    },

    renderSimilarTickets: function() {
        if (routes.newTicket.match) {
            return <SimilarTickets ticketModel={this.props.ticketModel} />;
        }
    },

    render: function() {

        return (
            <div>

                {this.isOperating() && <p>Ladataan...</p>}

                {this.renderSimilarTickets()}

                <input
                    disabled={this.isOperating()}
                    autoFocus
                    ref="title"
                    type="text"
                    onChange={this.handleChange}
                    value={this.props.ticketModel.get("title")}
                    placeholder="Otsikko" />
                <textarea
                    disabled={this.isOperating()}
                    ref="description"
                    placeholder="Kuvaus ongelmastasi"
                    value={this.props.ticketModel.get("description")}
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
