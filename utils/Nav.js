/** @jsx React.DOM */
"use strict";
var React = require("react");
var createRouter = require("routes");
var xtend = require("xtend");


function noop() { }

var ROUTES = [];

var Nav = {};

Nav.mountPoint = "";

function Route(path) {
    this._match = null;
    this._router = createRouter();
    this._path = path;

    [].concat(path).forEach(function(path) {
        this._router.addRoute(path, noop);
    }.bind(this));

    this._doMatch();
    ROUTES.push(this);
}

Route.prototype = {

    isMatch: function() {
        return !!this._match;
    },

    _doMatch: function() {
        this._match = this._router.match(Nav.getCurrentPath());
    },

    get: function(key) {
        if (!this.isMatch()) {
            throw new Error("Cannot get key '" + key + "' for route " + this._path + " - not matched!");
        }

        return this._match.params[key];
    }

};

Nav.createRoute = function(path) {
    return new Route(path);
};

Nav.Route = Route;


Nav.renderPathTemplate = function(tmpl, props) {
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

Nav.createLink = function(hrefTemplate, override) {

    var Link = React.createClass(xtend({

        go: function() {
            Link.go(this.props);
        },

        handleClick: function(e) {
            // Only left click navigates
            if (e && e.button !== 0) return;
            if (e && e.preventDefault) e.preventDefault();
            this.go();
        },

        renderHref: function() {
            return Link.renderHref(this.props);
        },

        render: function() {
            return (
                <a href={this.renderHref()} onClick={this.handleClick}>
                    {this.props.children}
                </a>
            );
        }
    }, override));

    Link.renderHref = function(props) {
        return Nav.renderPathTemplate(hrefTemplate, props);
    };

    Link.go = function(props) {
        Nav.go(Link.renderHref(props));
    };

    return Link;
};



function updateRoutes() {
    ROUTES.forEach(function(r) {
        r._doMatch();
    });

    if (typeof Nav.onNavigate === "function") {
        Nav.onNavigate();
    }
}


Nav.go = function(url) {
    history.pushState({}, "", Nav.mountPoint + url);
    console.log("navigate!", url);
    updateRoutes();
};

window.addEventListener("popstate", updateRoutes);

Nav.getCurrentPath = function() {
    var realPath = window.location.pathname;
    if (!Nav.mountPoint) return realPath || "/";
    if (realPath.substring(0, Nav.mountPoint.length) !== Nav.mountPoint) {
        console.error(
            "Navigate.mountPoint does not match with current url!",
            Nav.mountPoint, realPath
         );
         return;
    }
    realPath = realPath.slice(Nav.mountPoint.length);
    return realPath || "/";
};

module.exports = Nav;
