"use strict";

var parseOneAddress = require("email-addresses").parseOneAddress;
var Promise = require("bluebird");

require("app/db");
var Base = require("./Base");
var User = require("app/models/server/User");
var parseReplyEmailAddress = require("app/utils/parseReplyEmailAddress");

var STATES = {
    pending: 1,
    accepted: 2,
    rejecte: 3
};

var STATESr = {};
Object.keys(STATES).forEach(function(key) {
    STATESr[STATES[key]] = key;
});

/**
 * Email archive and review queue
 *
 * @namespace models.server
 * @extends models.server.Base
 * @class Email
 */
var Email = Base.extend({

    tableName: "emailArchive",

    defaults: function() {
        return {
            createdAt: new Date(),
            state: 1
        };
    },

    /**
     * User object fetched within Email#fetchUser()
     *
     * @property user
     * @type {models.server.User}
     */
    user: null,

    /**
     * Get state of the email
     *
     * @method getState
     * @return {String}
     */
    getState: function() {
        return STATESr[this.get("state")];
    },


    /**
     * Set email state as rejected
     *
     * @method reject
     * @return {models.server.Email}
     */
    reject: function() {
        return this.set({ state: STATES.rejected });
    },


    /**
     * @method getSenderEmail
     * @return {String}
     */
    getSenderEmail: function() {
        return parseOneAddress(this.get("email").fields.from).address;
    },

    /**
     * @method getSenderName
     * @return {String}
     */
    getSenderName: function() {
        return parseOneAddress(this.get("email").fields.from).name;
    },

    /**
     * @method getSubject
     * @return {String}
     */
    getSubject: function(){
        return this.get("email").fields.subject;
    },

    /**
     * @method getBody
     * @return {String}
     */
    getBody: function(){
        return this.get("email").fields["stripped-text"];
    },

    /**
     * @method getFiles
     * @return {Array} Array of file objects for Comment#addExistingAttachment
     */
    getFiles: function(){
        return this.get("email").files;
    },

    /**
     * @method fetchUser
     * @return {Bluebird.Promise} with model.server.User
     */
    fetchUser: function(){
        var self = this;
        return User.ensureUserByEmail(
            this.getSenderEmail(),
            "", // firstName
            this.getSenderName()
        ).then(function(user) {
            self.user = user;
            return user;
        });
    },

    /**
     * @method _parseRecipient
     * @return {Object}
     */
    _parseRecipient: function(){
        return parseReplyEmailAddress(this.get("email").fields.recipient);
    },

    /**
     * Return true if this email is a reply to existing ticket
     *
     * @method isReply
     */
    isReply: function(){
        return !!this._parseRecipient();
    },

    /**
     * The ticket id for which this email is a response to
     *
     * @method getTicketId
     * @return {Number}
     */
    getTicketId: function() {
        var ob = this._parseRecipient();
        if (!ob) {
            throw new Error("Cannot get ticket id for non reply recipient adress");
        }
        return ob.ticketId;
    },

    /**
     * @method getEmailSecret
     * @return {String}
     */
    getEmailSecret: function(){
        return this._parseRecipient().emailSecret;
    },

    /**
     * Create new ticket from this email
     *
     * @method submitAsNewTicket
     * @return {Bluebird.Promise} with the new models.server.Ticket
     */
    submitAsNewTicket: function(){
        var self = this;
        return this.fetchUser().then(function(user) {
            var Ticket = require("app/models/server/Ticket");
            return Ticket.create(
                self.getSubject(),
                self.getBody(),
                user,
                { textType: "email" }
            );
        })
        .then(function(ticket) {
            var comment = ticket.relations.comments.first();
            return Promise.all(self.getFiles().map(function(file) {
                return comment.addExistingAttachment(file);
            })).return(comment)
            .then(function(comment) {
                return self.set({
                    state: STATES.accepted,
                    commentId: comment.get("id")
                }).save();
            }).return(ticket);
        });
    },

    /**
     * Submit this ticket as reply to given ticket
     *
     * @method submitAsReply
     * @param {models.server.Ticket} ticket
     * @return {Bluebird.Promise} with models.server.Comment
     */
    submitAsReply: function(ticket){
        var self = this;
        return this.fetchUser().then(function(user) {
            return ticket.addComment(self.getBody(), user, {
                textType: "email"
            });
        })
        .then(function(comment) {
            return Promise.all(self.getFiles().map(function(file) {
                return comment.addExistingAttachment(file);
            })).return(comment);
        })
        .then(function(comment) {
            return self.set({
                state: STATES.accepted,
                commentId: comment.get("id")
            }).save();
        });
    },

});

/**
 * Email state id mapping. Useful for query building.
 *
 * @static
 * @property STATES
 * @type Object
 */
Email.STATES = STATES;

module.exports = Email;
