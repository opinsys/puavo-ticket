/** @jsx React.DOM */
var React = require("react");
var Promise = require("bluebird");

var Lightbox = require("./components/Lightbox");

var Route = require("./react-route");
var Link = Route.Link;

var RouteExisting = Route.create("/ticket/:uid");
var RouteNew = Route.create(/\/new.*/);
var RouteMore = Route.create("/new/more");

var TicketLink = Route.createLink("/ticket/:uid");
var NewTicketLink = Route.createLink("/new");

function generateUID(key) {
    key = "uid-" + key;
    var current = parseInt(localStorage[key] || 1, 10);
    current++;
    localStorage[key]  = current;
    return current;
}
function save(ticket) {
    if (!ticket.uid) ticket.uid = generateUID("ticket");
    return Promise.delay(200).then(function() {
        localStorage["ticket-" + ticket.uid] = JSON.stringify(ticket);
        return { uid: ticket.uid };
    });
}
function load(uid) {
    return Promise.delay(200).then(function() {
        return JSON.parse(localStorage["ticket-" + uid]);
    });
}

var AddUsers = React.createClass({
    render: function() {
        return (
            <div>
                <h1>Liitä käyttäjiä tukipyyntöön</h1>
                <p><i>Tähän hieno automaattisesti käyttäjiä hakeva multi select input juttu.</i></p>
                <button onClick={Lightbox.removeCurrentComponent}>OK</button>
            </div>
        );
    }
});

var AddDevices = React.createClass({
    render: function() {
        return (
            <div>
                <h1>Liitä laitteita tukipyyntöön</h1>
                <p><i>Tähän hieno automaattisesti käyttäjiä hakeva multi select input juttu.</i></p>
                <button onClick={Lightbox.removeCurrentComponent}>OK</button>
            </div>
        );
    }
});

var MetadataButtons = React.createClass({

    handleAddUsers: function(e) {
        Lightbox.displayComponent(AddUsers());
    },

    handleAddDevices: function(e) {
        Lightbox.displayComponent(AddDevices());
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


    render: function() {
        return (
            <div>
                <p>Tiedot tukipyynnön etenemisestä</p>

                <ul>
                {this.props.updates.map(function(update) {
                    return <li className="animated bounceInDown">{update}</li>;
                })}
                </ul>

                <input type="text" ref="updateText" />
                <button onClick={this.props.handleAddUpdate}>Lisää päivitys</button>
                <MetadataButtons />
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

    handleSave: function() {
        var saving = save({
            uid: this.state.uid,
            title: this.state.title,
            description: this.state.description
        });

        this.setState({ saving: saving });

        var self = this;
        saving.then(function(res) {
            self.setState({
                saving: null,
                uid: res.uid
            });
            TicketLink.navigate({ uid: res.uid });
            Lightbox.displayComponent(
                <div>
                    <h1>Tukipyyntö tallennettu!</h1>
                    <p>Nopeuttaaksesi tukipyynnön käsittelyä on erittäin suositeltua lisätä tarkentavia tietoja.</p>
                    <MetadataButtons />
                    <button onClick={Lightbox.removeCurrentComponent}>
                        Myöhemmin
                    </button>
                </div>
            );
        });

        saving.catch(function(err) {
            console.error("Saving failed!", err);
        });
    },

    componentWillMount: function() {
        if (!RouteExisting.match) return;

        var loading = load(RouteExisting.match.params.uid);
        this.setState({ loading: loading });

        var self = this;
        loading.then(function(res) {
            self.setState({
                loading: null,
                title: res.title,
                description: res.description,
                uid: res.uid
            });
        });

    },

    render: function() {
        return (
            <div>

                {this.isOperating() && <p>Ladataan...</p>}

                <RouteExisting>
                    <NewTicketLink />
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

                <RouteExisting>
                    <TicketUpdates
                        title={this.state.title}
                        description={this.state.description}
                        updates={this.state.updates}
                    />
                </RouteExisting>

            </div>
        );
    },


    handleAddUpdate: function() {
        var el = this.refs.updateText.getDOMNode();
        this.addUpdate(el.value);
        el.value = "";
    },

    addUpdate: function(text) {
        var updates = this.state.updates;
        text += " - " + new Date().toString();
        updates.push(text);
        this.setState({ updates: updates });
    }

});



var Main = React.createClass({

    render: function() {
        return (
            <div className="main">
                <h1>Tukipyyntö</h1>
                <Form />
            </div>
        );
    }

});

var main = <Main />;
React.renderComponent(main, document.getElementById("app"));
// Route.change = function() {
//     main.forceUpdate();
// };
