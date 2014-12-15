"use strict";
var Promise = require("bluebird");
var _ = require("lodash");
var marked = require("marked");
var fetch = require("app/utils/fetch");

var Base = require("./Base");
var UpdateMixin = require("./UpdateMixin");

/**
 * Client Comment model
 *
 * @namespace models.client
 * @class Comment
 * @extends models.client.Base
 * @uses models.TicketMixin
 * @uses models.client.UpdateMixin
 */
var Comment = Base.extend({

    _htmlCache: null,

    relationsMap: function() {
        return {
            attachments: require("./Attachment"),
            ticket: require("./Ticket"),
        };
    },

    defaults: function() {
        return {
            type: "comments",
            createdAt: new Date().toString(),
            comment: "",
            merged: []
        };
    },

    url: function() {
        return this.parent.url() + "/comments";
    },

    /**
     * Convert comment string to a HTML string assuming it is a Markdown string
     *
     * @method toHTML
     * @return {String}
     */
    toHTML: function(){
        // Because our client side models are immutable we can safely cache
        // this per model forever. i.e. the comment string will never change
        // during the lifetime of this model.
        if (this._htmlCache) return this._htmlCache;
        this._htmlCache = toMd(this.get("comment"));
        return this._htmlCache;
    },

    /**
     * Return comments that are merged to this comment using Comment#merge(...)
     *
     * @method getMergedComments
     * @return {Array} of models.client.Comment
     */
    getMergedComments: function() {
        var self = this;
        return this.get("merged").map(function(data) {
            return new Comment(data, { parent: self.parent });
        });
    },

    /**
     * Get one id string for all comments merged in this one
     *
     * @method getMergedId
     * @return String
     */
    getMergedId: function(){
        var ids = [this.get("id")];
        return ids.concat(this.get("merged").map(c => c.id)).join("-");
    },

    /**
     * @method ticket
     * @return {models.client.Ticket}
     */
    ticket: function() {
        return this.rel("ticket");
    },

    /**
     * @method hasAttachments
     * @return {Boolean}
     */
    hasAttachments: function(){
        var a = this.get("attachments");
        return a && a.length > 0;
    },


    /**
     * @method attachments
     * @return {Array} of models.client.Attachment
     */
    attachments: function() {
        throw new Error("bloo");
    },


    /**
     * @method addAttachments
     * @param {Array} files Array of HTML5 file objects
     * @param {Function} progressHandler Called multiple times during the upload progress
     * @param {Object} [options}
     * @param {Function} [options.onProgress] Called periodically when the upload progresses
     * @return {Bluebird.Promise}
     */
    addAttachments: function(files, options) {
        var ticketId = this.parent.get("id");
        var commentId = this.get("id");
        var url = "/api/tickets/" + ticketId +
            "/comments/" + commentId + "/attachments";

        return new Promise(function(resolve, reject){
            // XXX https://github.com/francois2metz/html5-formdata
            var formData = new FormData();
            files.forEach(function(file, i) {
                formData.append("file" + i, file);
            });

            var xhr = new XMLHttpRequest();
            xhr.onload = resolve;
            xhr.onerror = reject;
            xhr.upload.addEventListener("progress", function(e) {
                 if (!e.lengthComputable) return;
                 if (!options) return;
                 if (typeof options.onProgress !== "function") return;
                 var percentage = Math.round((e.loaded * 100) / e.total);
                 console.log("Uploaded", percentage, e.loaded, "/", e.total);
                 options.onProgress({
                     percentage: percentage,
                     loaded: e.loaded,
                     total: e.total,
                     originalEvent: e
                 });
            });

            xhr.open("POST", url, true);
            xhr.setRequestHeader("x-csrf-token", fetch.getCsrfToken());
            xhr.send(formData);
        });

    },

    /**
     * Merge two comments to new one
     *
     * @method merge
     * @param {models.client.Comment} another
     * @return {models.client.Comment}
     */
    merge: function(another){
        if (this.get("createdById") !== another.get("createdById")) {
            throw new Error("Can merge comments only from the same creator");
        }

        var data = this.toJSON();
        data.merged = data.merged.concat(another.toJSON());

        // Use the last timestamp for the whole merged comment
        data.createdAt = another.get("createdAt");
        return new Comment(data, { parent: this.parent });
    }

});

/**
 * Convert Markdown string to HTML
 *
 * @static
 * @method toMd
 * @param {String} s
 * @return {String}
 */
function toMd(s) {
    // Configure options here
    // https://github.com/chjj/marked
    return marked(s);
}

_.extend(Comment.prototype, UpdateMixin);

module.exports = Comment;
