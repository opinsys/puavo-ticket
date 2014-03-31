/** @jsx React.DOM */
var React = require("react");
var createRoutes = require("routes");
var xtend = require("xtend");

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
    if (!fields) return tmpl;
    fields.forEach(function(field) {
        var key = field.substring(1);
        var value = props[key];

        if (typeof value === "undefined") {
            throw new Error("prop \"" + key + "\" missing for link template " + tmpl);
        }

        if (value === null) value = "";

        // replace all http://stackoverflow.com/a/1145525/153718
        tmpl = tmpl.split(field).join(value);
    });

    return tmpl;
};

Route.createLink = function(hrefTemplate, override) {
    var Link = React.createClass(xtend({

        renderHref: function() {
            return Route.renderPathTemplate(hrefTemplate, this.props);
        },

        navigate: function(e) {
            if (e && e.preventDefault) e.preventDefault();
            Route.navigate(this.renderHref());
        },

        render: function() {
            return (
                <a href={this.renderHref()} onClick={this.navigate}>
                    {this.props.children}
                </a>
            );
        }
    }, override));

    Link.navigate = function(props) {
        Route.navigate(Route.renderPathTemplate(hrefTemplate, props));
    };

    return Link;
};

var routes = [];

var Link = Route.createLink(":href");

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
