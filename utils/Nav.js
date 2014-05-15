/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var createRouter = require("routes");
var xtend = require("xtend");
var Backbone = require("backbone");
var _ = require("lodash");

function noop() { }

var ROUTES = [];

/**
 * Simple routing and navigation for React.js
 *
 * @namespace utils
 * @class Nav
 */
var Nav = _.extend({}, Backbone.Events);

/**
 * Forced prefix for navigation
 *
 * @property {String} mountPoint
 */
Nav.mountPoint = "";

/**
 * Create new utils.Nav.Route instance for given path matcher
 *
 * @static
 * @method createRoute
 * @return {utils.Nav.Route}
 */
Nav.createRoute = function(path) {
    return new Route(path);
};


/**
 * @static
 * @method renderPathTemplate
 * @param {String} tmpl A URL path template
 * @param {Object} props Properties to be rendered on the template
 * @return {String}
 *
 * @example
 *     Nav.renderPathTemplate("/tickets/:id", { id: 1 }) // "/tickets/1"
 *
 */
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




function updateRoutes() {
    ROUTES.forEach(function(r) {
        r._doMatch();
    });

    /**
     * Event fired when the browser navigates from Nav.go(...) or from pop
     * state
     *
     * @event navigate
     */
    Nav.trigger("navigate");
}


/**
 * Navigate browser to a url
 *
 * @static
 * @method go
 * @param {String} url
 */
Nav.go = function(url) {
    history.pushState({}, "", Nav.mountPoint + url);
    console.log("navigate!", url);
    updateRoutes();
};

window.addEventListener("popstate", updateRoutes);

/**
 * Return the current browser url
 *
 * @static
 * @method getCurrentPath
 * @return {String}
 */
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





/**
 * Create React Link component. When clicked browser will navigate to given
 * href template. The template is compiled using the component props.
 *
 * @static
 * @method createLink
 * @return {utils.Nav.Link}
 */
Nav.createLink = function(hrefTemplate, override) {

    /**
     * @namespace utils.Nav
     * @class Link
     * @extends React.ReactComponent
     */
    var Link = React.createClass(xtend({

        /**
         * Navigate browser to the href of this component instance
         *
         * @method go
         */
        go: function() {
            Link.go(this.props);
        },

        /**
         * Render the href of this component instance using its props
         *
         * @method renderHref
         * @return {String}
         */
        renderHref: function() {
            return Link.renderHref(this.props);
        },

        handleClick: function(e) {
            // Only left click navigates
            if (e && e.button !== 0) return;
            if (e && e.preventDefault) e.preventDefault();
            this.go();
        },

        render: function() {
            return (
                <a href={this.renderHref()} onClick={this.handleClick}>
                    {this.props.children}
                </a>
            );
        }
    }, override));

    /**
     * Render href for given props
     *
     * @static
     * @method renderHref
     * @param {Object} props
     * @return {String}
     */
    Link.renderHref = function(props) {
        return Nav.renderPathTemplate(hrefTemplate, props);
    };

    /**
     * Navigate browser to hrefTemplate using the given props
     *
     * @static
     * @method go
     * @param {Object} props
     */
    Link.go = function(props) {
        Nav.go(Link.renderHref(props));
    };

    return Link;
};

/**
 * Small wrapper for routes.js
 *
 * https://github.com/aaronblohowiak/routes.js
 *
 * @namespace utils.Nav
 * @class Route
 * @constructor
 * @param {String} path
 *      Path matcher string. For example `/tickets/:id`. See routes.js
 *      documentation for details
 * @param {Object} [options]
 * @param {utils.Nav.Route} [options.depends]
 *      Other Route instances that must match before this Route matches.
 *
 */
function Route(path, options) {
    this._dependencies = [];
    this._match = null;
    this._router = createRouter();
    this._path = path;

    if (options && options.depends) {
        this._dependencies = [].concat(options.depends);
    }

    [].concat(path).forEach(function(path) {
        this._router.addRoute(path, noop);
    }.bind(this));

    this._doMatch();
    ROUTES.push(this);
}

Route.prototype = {

    /**
     * Returns true when when the current window.location matches with this route
     *
     * @method isMatch
     * @return {Boolean}
     */
    isMatch: function() {
        if (!this._match) return false;

        var invalidDep = this._dependencies.some(function(dep) {
            return !dep.isMatch();
        });

        return !invalidDep;
    },

    _doMatch: function() {
        if (this._matchedPath === Nav.getCurrentPath()) return;

        this._dependencies.forEach(function(route) {
            return route._doMatch();
        });
        this._matchedPath = Nav.getCurrentPath();
        this._match = this._router.match(this._matchedPath);
    },

    /**
     * Get value for given route param. Throws an error when the route does not
     * match.
     *
     * Route#get("id") with template `/tickets/:id` on url `/tickets/1`
     * returns `1`.
     *
     * @method get
     * @param {String} key
     */
    get: function(key) {
        if (!this.isMatch()) {
            throw new Error("Cannot get key '" + key + "' for route " + this._path + " - not matched!");
        }

        return this._match.params[key];
    }

};

Nav.Route = Route;
module.exports = Nav;