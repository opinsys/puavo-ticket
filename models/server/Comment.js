"use strict";

require("../../db");

var Base = require("./Base");
var User = require("./User");
var Attachment = require("./Attachment");
var Chunk = require("./Chunk");

/**
 * Comment for {{#crossLink "models.server.Ticket"}}{{/crossLink}}
 *
 * @namespace models.server
 * @extends models.server.Base
 * @class Comment
 */
var Comment = Base.extend({

    tableName: "comments",

    defaults: function() {
        return {
            createdAt: new Date(),
            updatedAt: new Date()
        };
    },

    createdBy: function() {
        return this.belongsTo(User, "createdById");
    },

    ticket: function() {
        var Ticket = require("./Ticket");
        return this.belongsTo(Ticket, "ticketId");
    },

    /**
     * Text for email notification when this model has changed
     *
     * @method textToEmail
     * @return {String}
     */
    textToEmail: function() {
        var self = this;

        return self.get("comment");
    },

    /**
     * Get all attachments of this comment
     *
     * @method attachments
     * @return {Bookshelf.Collection} Bookshelf.Collection of Attachment models
     */
    attachments: function() {
        return this.hasMany(Attachment, "commentId");
    },


    /**
     * Add file attachment to a ticket comment
     *
     * @method addAttachment
     * @param {Buffer|String} data
     * @param {String} filename
     * @param {String} dataType
     * @param {models.server.User} user
     */
    addAttachment: function(data, filename, dataType, createdBy){
        return Attachment.forge({
            createdById: Base.toId(createdBy),
            commentId: this.get("id"),
            size: data.length,
            filename: filename,
            dataType: dataType
        }).save()
        .then(function(attachment) {
            return Chunk.forge({
                id: attachment.getUniqueId(),
                chunk: data
            })
            .save({}, { method: "insert" })
            .return(attachment);
        });
    }

});

module.exports = Comment;
