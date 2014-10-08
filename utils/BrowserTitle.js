"use strict";

/**
 * Manage different parts of the browser title
 *
 * @namespace utils
 * @class BrowserTitle
 * @constructor
 * @param {Object} options
 * @param {String} options.trailingTitle Trailing part of the title which is
 * always displayed
 * @param {String} [props.document=window.document] Document object where the
 * title attribute will be set
 *
 */
function BrowserTitle(options) {
    this.title = "";
    this.noticationCount = 0;
    this._pending = false;

    if (typeof window !== "undefined") {
        this.document = window.document;
    }

    if (options) {
        this.trailingTitle = options.trailingTitle || "";
        if (options.document) {
            this.document = options.document;
        }
    }

    if (!this.document) throw new Error("Invalid document object!");
}

BrowserTitle.prototype = {

    /**
     * Set main title to given string
     *
     * @method setTitle
     * @param {String} title
     */
    setTitle: function(title) {
        this.title = title;
    },

    /**
     * @method getTitle
     * @return {String}
     */
    getTitle: function(){
        if (this.title) return this.title;
        return "";
    },

    /**
     * Notication count is displayed before the title. If count is zero it will
     * not be displayed at all
     *
     * @method setNotificationCount
     * @param {Number} count
     */
    setNotificationCount: function(count) {
        this.noticationCount = count;
    },

    /**
     * Get notification count string like "(3)" or empty string if the count is
     * zero
     *
     * @method getNotificationCount
     * @return {String}
     */
    getNotificationCount: function(){
        if (this.noticationCount) return "(" + this.noticationCount + ") ";
        return "";
    },

    /**
     * @method getTrailingTitle
     * @return {String}
     */
    getTrailingTitle: function() {
        if (!this.trailingTitle) return "";
        if (this.title) return " - " + this.trailingTitle;
        else return this.trailingTitle;
    },

    /**
     * Applies the title changes on the next tick. Avoids title hammering when
     * called multiple times during a single stack
     *
     * @method activateOnNextTick
     */
    activateOnNextTick: function() {
        if (this._pending) return;
        this._pending = true;
        var self = this;
        setTimeout(function() {
            self._pending = false;
            self.activateNow();
        }, 0);
    },

    /**
     * @method showInFavicon
     * @param {String} s
     */
    showInFavicon: function(s) {
        var Tinycon = require("app/vendor/tinycon.shim");
        Tinycon.setBubble(s);
    },

    /**
     * Apply title changes immediately
     *
     * @method activateNow
     */
    activateNow: function() {
        this.document.title = this.getNotificationCount() + this.getTitle() + this.getTrailingTitle();
        this.showInFavicon(this.noticationCount);
    },

};


module.exports = BrowserTitle;
