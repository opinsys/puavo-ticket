/** @jsx React.DOM */
var React = require("react/addons");
// var Promise = require("bluebird");

var TicketModel = require("./TicketModel");

var Lightbox = require("./components/Lightbox");

var Route = require("./react-route");
// var Link = Route.Link;

var RouteExisting = Route.create("/ticket/:uid");
var RouteNew = Route.create(/\/new.*/);
// var RouteMore = Route.create("/new/more");

var TicketLink = Route.createLink("/ticket/:uid");
var NewTicketLink = Route.createLink("/new");

var TicketModelType = React.PropTypes.shape({
    save: React.PropTypes.func.isRequired,
    load: React.PropTypes.func.isRequired,
    addUpdate: React.PropTypes.func.isRequired
});


var AddUsers = React.createClass({

    propTypes: {
        ticketModel: TicketModelType.isRequired
    },

    handleOk: function() {
        this.props.ticketModel.addUpdate({
            type: "username",
            value: "Käyttäjä 'epeli' liitettiin pyyntöön"
        });
        Lightbox.removeCurrentComponent();
    },

    render: function() {
        return (
            <div>
                <h1>Liitä käyttäjiä tukipyyntöön</h1>
                <p><i>Tähän hieno automaattisesti käyttäjiä hakeva multi select input juttu.</i></p>
                <button onClick={this.handleOk}>OK</button>
            </div>
        );
    }
});

var AddDevices = React.createClass({

    propTypes: {
        ticketModel: TicketModelType.isRequired
    },

    handleOk: function() {
        this.props.ticketModel.addUpdate({
            type: "device",
            value: "Laite toimisto-06 liitettiin pyyntöön"
        });
        Lightbox.removeCurrentComponent();
    },

    render: function() {
        return (
            <div>
                <h1>Liitä laitteita tukipyyntöön</h1>
                <p><i>Tähän hieno automaattisesti käyttäjiä hakeva multi select input juttu.</i></p>
                <button onClick={this.handleOk}>OK</button>
            </div>
        );
    }

});

var MetadataButtons = React.createClass({

    propTypes: {
        ticketModel: TicketModelType.isRequired
    },

    handleAddUsers: function(e) {
        Lightbox.displayComponent(AddUsers({ ticketModel: this.props.ticketModel }));
    },

    handleAddDevices: function(e) {
        Lightbox.displayComponent(AddDevices({ ticketModel: this.props.ticketModel }));
    },

    render: function() {
        return (
            <div className="metadata">
                Liitä
                <div className="actions" >
                    <button onClick={this.handleAddDevices} className="fa fa-laptop" title="Laite"></button>
                    <button onClick={this.handleAddUsers}className="fa fa-user" title="Käyttäjätunnus"></button>
                    <button className="fa fa-cloud-upload" title="Liitetiedosto"></button>
                    <button className="fa fa-play-circle-o" title="Kuvakaappaus"></button>
                </div>
            </div>
        );
    }
});


var TicketUpdates = React.createClass({

    propTypes: {
        ticketModel: TicketModelType.isRequired
    },

    handleAddTextUpdate: function(e) {
        var el = this.refs.updateText.getDOMNode();
        this.props.ticketModel.addUpdate({
            type: "text",
            value: el.value
        });
        el.value = "";
    },

    render: function() {
        return (
            <div>
                <p>Tiedot tukipyynnön etenemisestä</p>

                <ul>
                {this.props.updates.map(function(update) {
                    return <li key={update.value} className="animated bounceInDown">{update.value} - {update.added.toString()}</li>;
                })}
                </ul>

                <input type="text" ref="updateText" />
                <button onClick={this.handleAddTextUpdate}>Lisää päivitys</button>
                <MetadataButtons ticketModel={this.props.ticketModel} />
            </div>
        );
    }
});

var SimilarTickets = React.createClass({

    render: function() {
        if (this.props.title.length < 5) return <noscript />;
        if (this.props.description.length < 5) return <noscript />;
        return (
            <div className="animated fadeIn similar-tickets">
                <h2>Samankaltaiset tukipyynnöt</h2>
                <ul>
                    <li>
                        <a href="#">xmoto ei löydy menusta</a>
                    </li>
                    <li>
                        <a href="#">bsdgames paketin asennus</a>
                    </li>
                    <li>
                        <a href="#">milloin tulee trusty</a>
                    </li>
                </ul>
                <p>
                    Ethän avaa toista tukipyyntöä samasta aiheesta. Kiitos.
                </p>
            </div>
        );
    },

});


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
