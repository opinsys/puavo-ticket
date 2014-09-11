"use strict";

require("app/db");
var Base = require("./Base");
var Chunk = require("./Chunk");

/**
 * Attachments for {{#crossLink "models.server.Ticket"}}{{/crossLink}}
 *
 * @namespace models.server
 * @extends models.server.Base
 * @class Attachment
 */
var Attachment = Base.extend({

    tableName: "attachments",

    defaults: function() {
        return {
            createdAt: new Date(),
            updatedAt: new Date()
        };
    },

    /**
     * Get attachment content-type ensuring utf-8 if it is a text type
     * charset=utf-8
     *
     * @method getContentType
     * @return {String}
     */
    getContentType: function(){
        var type = this.get("dataType");
        if (type === "text/plain") {
            return type + "; charset=utf-8";
        }
        return type;
    },

    /**
     * @method chunks
     * @return {Bookshelf.Collection} Collection of model.server.Chunk
     */
    chunks: function() {
        var self = this;
        return Chunk.collection().query(function(q) {
            q.where({ id: self.getUniqueId() });
            q.orderBy("sequence", "asc");
        });
    },

    /**
     * Fetch content of this attachment
     *
     * @method fetchContent
     * @return {Bluebird.Promise} with data of the attachment in a buffer
     */
    fetchContent: function() {
        return this.chunks().fetch()
            .then(function(chunks) {
                return Buffer.concat(chunks.pluck("chunk"));
            });
    },

});

module.exports = Attachment;
