/** @jsx React.DOM */
var React = require("react");

var Route = require("./react-route");
var Link = Route.Link;

var More = React.createClass({
    render: function() {
        return (
            <div>

                <Link href="/more/other">other</Link>
                <Link href="/more/info">info</Link>
                <Route path={/.*info$/} name="info">
                    <div>
                    hoho
                    </div>
                    <div>
                    hoho2
                    </div>
                </Route>

                <h2>Tukipyyntö on lähetetty!</h2>

                <blockquote>
                    <h3>{this.props.title}</h3>
                    <p>{this.props.description}</p>
                </blockquote>

                <h2>Lisätiedot</h2>

                <p>Nopeuttaaksesi tukipyynnön käsittelyä on erittäin
                    suositeltua lisätä tarkentavia tietoja.</p>

                <table>
                    <tr>
                        <th>Pyyntöön liittyvät laitteet</th>
                        <td>
                            <select>
                                <option>--</option>
                                <option>neukkari</option>
                                <option>dell-xps</option>
                                <option>yoga-pro</option>
                            </select> +
                        </td>
                    </tr>
                    <tr>
                        <th>Pyyntöön liittyvät käyttäjä tunnukset</th>
                        <td>
                            <select>
                                <option>--</option>
                                <option>epeli</option>
                                <option>hannele</option>
                                <option>vm</option>
                                <option>jouni</option>
                            </select> +
                        </td>
                    </tr>
                    <tr>
                        <th>Kuvakaappaus</th>
                        <td>
                            <button>Ota kuvakaappaus</button> +
                        </td>
                    </tr>
                    <tr>
                        <th>Liitetiedosto</th>
                        <td>
                            <button>Valitse...</button> +
                        </td>
                    </tr>
                </table>

                <h2>Päivitykset</h2>

                <p>Tiedot tukipyynnön etenemisestä</p>

                <ul>
                {this.props.updates.map(function(update) {
                    return <li className="animated bounceInDown">{update}</li>;
                })}
                </ul>

                <input type="text" ref="updateText" />
                <button onClick={this.props.handleAddUpdate}>Lisää päivitys</button>

            </div>
        );
    }
});


var Form = React.createClass({

    getInitialState: function() {
        return {
            currentForm: "description",
            description: "",
            updates: [],
            title: ""
        };
    },


    gotoDescription: function() {
        this.setState({ currentForm: "description" });
    },

    handleChange: function() {
        this.setState({
            description: this.refs.description.getDOMNode().value,
            title: this.refs.title.getDOMNode().value,
        });
    },

    renderSimilarTickets: function() {
        if (this.state.title.length < 5) return;
        if (this.state.description.length < 5) return;
        return (
            <div className="animated fadeIn">
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

    renderDescriptionForm: function() {
        return (
            <div>

                {this.renderSimilarTickets()}
                <input
                    autoFocus
                    ref="title"
                    type="text"
                    onChange={this.handleChange}
                    value={this.state.title}
                    placeholder="Otsikko" />
                <textarea
                    ref="description"
                    placeholder="Kuvaus ongelmastasi"
                    value={this.state.description}
                    onChange={this.handleChange}
                />
                <div className="button-wrap">
                    <button onClick={this.handleSave}>Lähetä</button>
                </div>

                <Link href="/more/">lisää</Link>
                <br />
                <Link href="/">pois</Link>

                <Route path="/more/:foo?" name="more">
                    <More
                        title={this.state.title}
                        description={this.state.description}
                        updates={this.state.updates}
                    />
                </Route>
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
    },

    render: function() {
        return this.renderDescriptionForm();
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
React.renderComponent(main, document.body);
// Route.change = function() {
//     main.forceUpdate();
// };
