/** @jsx React.DOM */
var React = require("react");
var createRoutes = require("routes");

function noop() { }

var Route = {};

Route.create = function(path) {

    var _Route =  React.createClass({

        componentWillMount: function() {
            _Route.components.push(this);
            // _Route.matchRoute();
        },

        componentWillReceiveProps: function() {
            // _Route.matchRoute();
        },

        componentWillUnmount: function() {
            var i = _Route.components.indexOf(this);
            if (i > -1) _Route.components.splice(i, 1);
        },

        getMatch: function() {
            return _Route.match;
        },

        render: function() {
            if (!_Route.match) {
                return React.DOM.noscript(null);
            }

            if (Array.isArray(this.props.children)) {
                return React.DOM.div(null, this.props.children);
            }

            return this.props.children || React.DOM.noscript(null);
        }
    });

    _Route.router = createRoutes();
    _Route.components = [];

    [].concat(path).forEach(function(path) {
        _Route.router.addRoute(path, noop);
    });

    _Route.matchRoute = function() {
        _Route.match = _Route.router.match(Route.getCurrentRoute());
        _Route.components.forEach(function(component) {
            component.forceUpdate();
        });
        return _Route.match;
    };

    routes.push(_Route);
    _Route.matchRoute();
    return _Route;
};


Route.renderPathTemplate = function(tmpl, props) {
    var fields = tmpl.match(/\:[a-zA-Z]+/g);
    fields.forEach(function(field) {
        var key = field.substring(1);
        var value = props[key];
        if (typeof value !== "string") value = "";
        // TODO: replace all
        tmpl = tmpl.replace(field, value);
    });

    return tmpl;
};

Route.createLink = function(pathTemplate) {
    return React.createClass({

        computeHref: function() {
            return Route.renderPathTemplate(pathTemplate, this.props);
        },

        handleClick: function(e) {
            e.preventDefault();
            Route.navigate(this.computeHref());
        },

        render: function() {
            return (
                <a href={this.computeHref()} onClick={this.handleClick}>
                    {this.props.children}
                </a>
            );
        }
    });
};

var routes = [];


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

function updateStates() {
    routes.forEach(function(r) {
        r.matchRoute();
    });
}

Route.navigate = function(url) {
    history.pushState({}, "", url);
    updateStates();
};

window.onpopstate = function() {
    updateStates();
};

Route.getCurrentRoute = function() {
    return window.location.pathname;
};

Route.Link = Link;
module.exports = Route;
