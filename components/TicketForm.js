/** @jsx React.DOM */
var React = require("react/addons");
var Promise = require("bluebird");

var Lightbox = require("./Lightbox");
var MetadataButtons = require("./MetadataButtons");
var SimilarTickets = require("./SimilarTickets");
var TicketUpdates = require("./TicketUpdates");
var SelectUsers = require("./SelectUsers");

var routes = require("./routes");
var RouteNew = routes.RouteNew;
var RouteExisting = routes.RouteExisting;
var LinkTicket = routes.LinkTicket;

var TicketForm = React.createClass({

    // propTypes: {
    //     ticketModel: TicketModel.Type.isRequired
    // },

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
        console.log("binding model to" , this);
        if (RouteExisting.match) {
            this.props.ticketModel.set({ id: RouteExisting.match.params.id });
            this.props.ticketModel.fetch();
        }
    },

    handleSave: function() {
        var self = this;
        this.props.ticketModel.save().then(function(foo) {
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

    render: function() {
        console.log("render form", this.isOperating());
        return (
            <div>

                {this.isOperating() && <p>Ladataan...</p>}

                <RouteNew>
                    <SimilarTickets
                        ticketModel={this.props.ticketModel}
                    />
                </RouteNew>

                <RouteExisting>
                    <div style={{border: "1px solid red", margin: "1em", padding: "1em", opacity: 0.5}}>
                        <h3>Tällä tukipyynnöllä ei ole käsittelijää!</h3>
                        <SelectUsers onChange={this.handleUserSelect} />

                        <p>
                            <i>tämä näkyy vain henkilökunnalle</i>
                        </p>

                    </div>
                </RouteExisting>

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
