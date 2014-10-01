"use strict";

var db = require("app/db");

var filesize = require("filesize");
var prettyMs = require("pretty-ms");
var debugAttachment = require("debug")("app:attachments");


var Attachment = require("./Attachment");
var Base = require("./Base");
var User = require("./User");
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

    addAttachmentMeta: function(filename, dataType, fileSize, createdBy) {
        return Attachment.forge({
            createdById: Base.toId(createdBy),
            commentId: this.get("id"),
            size: fileSize,
            filename: filename,
            dataType: dataType
        }).save();
    },

    /**
     * Render model to plain text for email or similar usage
     *
     * @method toPlainText
     * @return {String}
     */
    toPlainText: function(){
        if (!this.relations.createdBy) {
            throw new Error("'createdBy' relation not loaded");
        }

        return this.relations.createdBy.getFullName() + "\n" + this.get("comment");
    },

    /**
     * Add file attachment to a ticket comment
     *
     * @method addAttachment
     * @param {Buffer|String} data
     * @param {String} filename
     * @param {String} dataType
     * @param {stream.Readable} stream Node.js readable stream
     * @param {models.server.User} user
     */
    addAttachment: function(filename, dataType, stream, createdBy){
        return this.addAttachmentMeta(filename, dataType, -1, createdBy)
        .then(function(attachment) {
            var start = Date.now();
            debugAttachment("Starting database write for %s", filename);
            return db.gridSQL.write(attachment.getFileId(), stream)
            .then(function(info) {
                var duration = Date.now() - start;
                var speed = info.bytesWritten / (duration / 1000);
                debugAttachment(
                    "Wrote %s in %s (%s/s) using %s chunks for %s",
                    filesize(info.bytesWritten),
                    prettyMs(duration),
                    filesize(speed),
                    info.chunkCount,
                    filename
                );
                return attachment.set({
                    size: info.bytesWritten,
                    chunkCount: info.chunkCount
                }).save();
            });
        });
    }

});

module.exports = Comment;
