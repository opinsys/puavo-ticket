/** @jsx React.DOM */
var React = require("react");
// var Router = require("react-router-component");
// var Locations = Router.Locations;
// var Location = Router.Location;
// var Link = Router.Link;


var createRouter = require("routes");
// var router = require('routes')();

var root = { root: true };
var current = root;

var _Route = React.createClass({

    componentWillMount: function() {
        this.router = createRouter();
        console.log("Adding route", this.props.path);
        this.router.addRoute(this.props.path);
    },

    render: function() {
        var match = this.router.match(window.location.pathname);
        current[this.props.name] = match;
        current = match;

        if (!match) return;
        // React.Chilren.forEach(this.props.children, function(node) {
        //     node.
        // });
        return this.props.children;
    }


});

function Route(props) {

}


var SimilarTickets = React.createClass({
    render: function() {
        if (this.props.title.length < 5) return;
        if (this.props.description.length < 5) return;
        return (
            <div className="animated fadeIn other-tickets">
                <p>Samankaltaiset tukipyynnöt</p>
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
                    <li>
                        <a href="#">boo bar</a>
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
            title: "",
            description: "",
            updates: [],
        };
    },

    handleChange: function() {
        this.setState({
            description: this.refs.description.getDOMNode().value,
            title: this.refs.title.getDOMNode().value,
        });
    },


    handleSave: function() {
        this.refs.router.navigate("/ticket/1");
    },

    render: function() {
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
                    <button onClick={this.handleSave}>Tallenna</button>
                </div>

                <Link href="/more">Lisätiedot</Link>

                <div className="more-info">
                </div>

            </div>
            );
    }


});

var Extra = React.createClass({

    render: function() {
        return (
            <div>
                <p>Extra {this.props.value}</p>
            </div>
        );
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
