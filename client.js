/** @jsx React.DOM */
var React = require("react/addons");
// var Promise = require("bluebird");

var TicketModel = require("./TicketModel");

var Lightbox = require("./components/Lightbox");
var MetadataButtons = require("./components/MetadataButtons");
var SimilarTickets = require("./components/SimilarTickets");
var TicketUpdates = require("./components/TicketUpdates");

var Route = require("./react-route");
// var Link = Route.Link;

var RouteExisting = Route.create("/ticket/:uid");
var RouteNew = Route.create(/\/new.*/);
// var RouteMore = Route.create("/new/more");

var TicketLink = Route.createLink("/ticket/:uid");
var NewTicketLink = Route.createLink("/new");


var Form = React.createClass({

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
            TicketLink.navigate({ uid: self.state.uid });
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

                <RouteExisting>
                    <NewTicketLink>Uusi tukipyyntö</NewTicketLink>
                </RouteExisting>


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


var Main = React.createClass({

    render: function() {
        return (
            <div className="main">
                <h1>Tukipyyntö</h1>
                <RouteNew>
                    <Form ticketModel={new TicketModel()} />
                </RouteNew>

                <RouteExisting>
                    <Form ticketModel={new TicketModel()} />
                </RouteExisting>

            </div>
        );
    }

});

React.renderComponent(<Main />, document.getElementById("app"));
