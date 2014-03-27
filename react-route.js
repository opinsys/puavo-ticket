/** @jsx React.DOM */
var React = require("react");
var createRoutes = require("routes");

function noop() { }

var components = [];


var Route = React.createClass({

    componentWillMount: function() {
        console.log("mounting", this.props.name);

        if (this.props.name) {
            if (typeof Route.routes[this.props.name] === "undefined") {
                Route.routes[this.props.name] = null;
            } else {
                console.error("Route ", this.props.name, "already exists!");
                return;
            }
        }

        this.router = createRoutes();

        var self = this;

        [].concat(this.props.path).forEach(function(path) {
            self.router.addRoute(path, noop);
        });

        components.push(this);
    },

    componentWillUnmount: function() {
        console.log("unmounting", this.props.name);
        if (this.props.name) {
            delete Route.routes[this.props.name];
        }
        var i = components.indexOf(this);
        if (i > -1) components.splice(i, 1);
    },

    render: function() {
        var match = this.router.match(Route.getCurrentRoute());
        if (!match) {
            Route.routes[this.props.name] = null;
            return <noscript />;
        }

        if (Array.isArray(this.props.children)) {
            return <div>{this.props.children}</div>;
        }
        return this.props.children;
    }
});

var Link = React.createClass({
    handleClick: function(e) {
        e.preventDefault();
        Route.navigate(this.props.href);
    },

    render: function() {
        return (
            <a href={this.props.href} onClick={this.handleClick}>
                {this.props.children}
            </a>
        );
    }
});

function updateStates(url) {
    components.forEach(function(node) {
        // node.setState({ current: url });
        node.forceUpdate();
    });
}

Route.routes = {};

Route.navigate = function(url) {
    history.pushState({}, "", url);
    updateStates(url);
};

window.onpopstate = function() {
    updateStates(Route.getCurrentRoute());
};


Route.getCurrentRoute = function() {
    return window.location.pathname;
};

Route.Link = Link;

module.exports = Route;
