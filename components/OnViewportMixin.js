"use strict";
var React = require("react/addons");

var WINDOW_FOCUS = true;

window.addEventListener("focus", function(){
    WINDOW_FOCUS = true;
});
window.addEventListener("blur", function(){
    WINDOW_FOCUS = false;
});



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
 * @param {Function} props.onOffViewport
 *      Called when the component disappear from the viewport
 */
var OnViewportMixin = {

    propTypes: {
        onViewport: React.PropTypes.func,
        onOffViewport: React.PropTypes.func
    },

    getDefaultProps: function() {
        return {
            onViewport: function() { },
            onOffViewport: function() { }
        };
    },

    componentDidMount: function() {
        this._isVisible = false;
        this._hasFocus = true;
        window.addEventListener("scroll", this._emit);
        window.addEventListener("resize", this._emit);
        window.addEventListener("focus", this._emit);
        window.addEventListener("blur", this._emit);
        this._emit();
    },


    componentWillUnmount: function() {
        window.removeEventListener("scroll", this._emit);
        window.removeEventListener("resize", this._emit);
        window.removeEventListener("focus", this._emit);
        window.removeEventListener("blur", this._emit);
    },

    _emit: function() {
        var visible = this.isInViewport() && WINDOW_FOCUS;

        var changed = visible !== this._isVisible;

        if (visible && changed) {
            this.props.onViewport(this.props);
        }

        if (!visible && changed) {
            this.props.onOffViewport(this.props);
        }

        this._isVisible = visible;
    },

    /**
     *
     * @method isVisible
     * @return {Boolean}
     */
    isVisible: function(){
        return this._isVisible;
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
