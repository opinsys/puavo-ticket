/** @jsx React.DOM */
"use strict";
var React = require("react");
var createRoutes = require("routes");
var xtend = require("xtend");


function noop() { }

var Route = {};
Route.mountPoint = "";

Route.create = function(path) {

    var _Route =  React.createClass({

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
            // Only left click navigates
            if (e && e.button !== 0) return;
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
var rootComponents = [];

var Link = Route.createLink(":href");

function updateRoutes() {
    routes.forEach(function(r) {
        r.matchRoute();
    });

    rootComponents.forEach(function(component) {
        component.forceUpdate();
    });
}


Route.Mixin = {
    componentDidMount: function() {
        rootComponents.push(this);
    },

    componentWillUnmount: function() {
        var i = rootComponents.indexOf(this);
        if (i > -1) rootComponents.splice(i, 1);
    }
};

Route.navigate = function(url) {
    history.pushState({}, "", Route.mountPoint + url);
    console.log("navigate!", url);
    updateRoutes();
};

window.addEventListener("popstate", function() {
    console.log("popstate!");
    updateRoutes();
});

Route.getCurrentRoute = function() {
    var realPath = window.location.pathname;
    if (!Route.mountPoint) return realPath || "/";
    if (realPath.substring(0, Route.mountPoint.length) !== Route.mountPoint) {
        console.error(
            "Route.mountPoint does not match with current url!",
            Route.mountPoint, realPath
         );
         return;
    }
    realPath = realPath.slice(Route.mountPoint.length);
    return realPath || "/";
};

Route.Link = Link;
module.exports = Route;
