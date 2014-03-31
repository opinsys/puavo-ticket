/** @jsx React.DOM */
var React = require("react/addons");

var Lightbox = require("./Lightbox");
var MetadataButtons = require("./MetadataButtons");
var SimilarTickets = require("./SimilarTickets");
var TicketUpdates = require("./TicketUpdates");

var TicketModel = require("../TicketModel");

var routes = require("./routes");
var RouteNew = routes.RouteNew;
var RouteExisting = routes.RouteExisting;
var LinkTicket = routes.LinkTicket;

var TicketForm = React.createClass({

    propTypes: {
        ticketModel: TicketModel.Type.isRequired
    },

    getInitialState: function() {
        return {
            description: "",
            title: "",
            displayExtra: true,
            saving: null,
            updates: []
        };
    },

    handleChange: function() {
        this.setState({
            description: this.refs.description.getDOMNode().value,
            title: this.refs.title.getDOMNode().value,
        });
    },

    isOperating: function() {
        return this.state.saving || this.state.loading;
    },

    componentWillMount: function() {
        console.log("binding model to" , this);
        this.props.ticketModel.bindToComponent(this);
        if (RouteExisting.match) {
            this.props.ticketModel.load(RouteExisting.match.params.uid);
        }
    },

    handleSave: function() {
        var self = this;
        this.props.ticketModel.save().done(function() {
            LinkTicket.navigate({ uid: self.state.uid });
            Lightbox.displayComponent(
                <div>
                    <h1>Tukipyyntö tallennettu!</h1>
                    <p>Nopeuttaaksesi tukipyynnön käsittelyä on erittäin suositeltua lisätä tarkentavia tietoja.</p>
                    <MetadataButtons ticketModel={self.props.ticketModel} />
                    <button onClick={Lightbox.removeCurrentComponent}>
                        Myöhemmin
                    </button>
                </div>
            );
        });
    },

    render: function() {
        return (
            <div>

                {this.isOperating() && <p>Ladataan...</p>}



                <RouteNew>
                    <SimilarTickets
                        title={this.state.title}
                        description={this.state.description}
                    />
                </RouteNew>

                <input
                    disabled={this.isOperating()}
                    autoFocus
                    ref="title"
                    type="text"
                    onChange={this.handleChange}
                    value={this.state.title}
                    placeholder="Otsikko" />
                <textarea
                    disabled={this.isOperating()}
                    ref="description"
                    placeholder="Kuvaus ongelmastasi"
                    value={this.state.description}
                    onChange={this.handleChange}
                />

                <div className="button-wrap">
                    <button
                        disabled={this.isOperating()}
                        onClick={this.handleSave} >Tallenna</button>
                </div>

                <RouteNew>
                    <MetadataButtons ticketModel={this.props.ticketModel} />
                </RouteNew>

                <RouteExisting>
                    <TicketUpdates
                        title={this.state.title}
                        description={this.state.description}
                        updates={this.state.updates}
                        ticketModel={this.props.ticketModel}
                    />
                </RouteExisting>

            </div>
        );
    },


});

module.exports = TicketForm;
