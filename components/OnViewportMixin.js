"use strict";
var React = require("react/addons");

/**
 * This React component mixin adds onViewport callback prop. It's called when
 * the component is scrolled to the visible viewport
 *
 * @namespace components
 * @class OnViewportMixin
 * @constructor
 * @param {Object} props
 * @param {Function} props.onViewport
 *      Called when the component appear in the viewport
 */
var OnViewportMixin = {

    propTypes: {
        onViewport: React.PropTypes.func.isRequired
    },

    componentDidMount: function() {
        this._wasInViewport = false;
        window.addEventListener("scroll", this._emitOnViewport);
        window.addEventListener("resize", this._emitOnViewport);
        this._emitOnViewport();
    },

    componentWillUnmount: function() {
        window.removeEventListener("scroll", this._emitOnViewport);
        window.removeEventListener("resize", this._emitOnViewport);
    },

    _emitOnViewport: function() {
        if (typeof this.props.onViewport !== "function") return;

        if (!this.isInViewport()) {
            this._wasInViewport = false;
            return;
        }

        // If was in viewport on the last time do not emit the same event again
        if (this._wasInViewport) return;

        this.props.onViewport(this.props);
        this._wasInViewport = true;
    },

    /**
     * Return true if the component is in the viewport ie. scrolled so the user
     * can see it.
     *
     * src: https://gist.github.com/
     * @method isInViewport
     * @return {Boolean}
     */
    isInViewport: function() {
        if (!this.isMounted()) return false;
        var rect = this.getDOMNode().getBoundingClientRect();
        var html = document.documentElement;
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || html.clientHeight) &&
            rect.right <= (window.innerWidth || html.clientWidth)
        );
    },

};

module.exports = OnViewportMixin;
