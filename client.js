/** @jsx React.DOM */
var React = require("react");



var Form = React.createClass({

    getInitialState: function() {
        return {
            currentForm: "description",
            description: "",
            updates: [],
            title: ""
        };
    },

    gotoExtra: function() {
        this.setState({ currentForm: "extra" });
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
                    <button onClick={this.gotoExtra}>Lähetä</button>
                </div>
                {this.renderSimilarTickets()}
            </div>
            );
    },

    renderExtra: function() {
        return (
            <div>
                <h2>Tukipyyntö on lähetetty!</h2>
                <p>
                    Voit vielä halutessasi <a href="#" onClick={this.gotoDescription}>muokata</a> pyyntöäsi.
                </p>

                <blockquote>
                    <h3>{this.state.title}</h3>
                    <p>{this.state.description}</p>
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
                {this.state.updates.map(function(update) {
                    return <li className="animated fadeIn">{update}</li>;
                })}
                </ul>

                <input type="text" ref="updateText" />
                <button onClick={this.handleAddUpdate}>Lisää päivitys</button>

            </div>
            );
    },

    handleAddUpdate: function() {
        this.addUpdate(this.refs.updateText.getDOMNode().value);
    },

    addUpdate: function(text) {
        var updates = this.state.updates;
        text += " - " + new Date().toString();
        updates.push(text);
        this.setState({ updates: updates });
    },

    componentDidUpdate: function() {
        var self = this;
        if (this._read) return;
        self._read = true;
        setTimeout(this.addUpdate.bind(self, "Petri luki pyyntösi"), 5000);
    },

    render: function() {
        if (this.state.currentForm === "description") {
            return this.renderDescriptionForm();
        }

        if (this.state.currentForm === "extra") {
            return this.renderExtra();
        }


        return <p>wut?</p>;
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

React.renderComponent(<Main />, document.body);
