"use strict";

require("colors");
process.env.BLUEBIRD_DEBUG = "true";

var _ = require("lodash");
var Promise = require("bluebird");
var crypto = require('crypto');

var Ticket = require("app/models/server/Ticket");
var User = require("app/models/server/User");
var Comment = require("app/models/server/Comment");
var Title = require("app/models/server/Title");
var Tag = require("app/models/server/Tag");

function generateIdForComment(rawComment) {
    var shasum = crypto.createHash('sha1');
    shasum.update(rawComment.created_at);
    shasum.update(rawComment.commenter.external_id);
    return shasum.digest('hex');
}

function addTicket(rawTicket) {
    if (!rawTicket.title) {
        console.log("Ticket has no title".red, rawTicket.zendesk_id);
        return Promise.resolve();
    }
    return User.ensureUserByEmail(rawTicket.submitter.email)
    .catch(function(err) {
        throw new Error("Cannot find user for " + JSON.stringify(rawTicket.submitter));
    })
    .then(function(creator) {
        return Ticket.fetchOrCreate({
            createdById: creator.get("id"),
            createdAt: rawTicket.created_at,
            zendeskTicketId: rawTicket.zendesk_id
        })
        .then(function(ticket) {

            if (ticket.isNew()) {
                console.log("Adding new ticket from zendesk id".yellow, ticket.get("zendeskTicketId"));
            } else {
                console.log("Updating existing ticket".green, ticket.get("id"), ticket.get("zendeskTicketId"));
            }

            return ticket.save();
        })
        .then(function setStatus(ticket) {
            var status = rawTicket.status;
            if (!status) {
                console.error("Invalid status in".red, rawTicket.zendesk_id);
                status = "open";
            }

            return Tag.fetchOrCreate({
                tag: "status:" + rawTicket.status,
                createdById: creator.get("id"),
                ticketId: ticket.get("id"),
            })
            .then(function(tag) {
                if (tag.isNew()) {
                    tag.set({
                        createdAt: new Date(),
                    });
                }
                return tag.save();
            })
            .return(ticket);
        })
        .then(function addHandlers(ticket) {

            function getEmail(user) {
                if (!user.email) {
                    throw new Error("User has no email: " + JSON.stringify(user));
                }
                return user.email;

            }

            var handlers = [getEmail(rawTicket.submitter)];

            if (rawTicket.requester) {
                handlers.push(getEmail(rawTicket.requester));
            }

            if (rawTicket.assignee) {
                handlers.push(getEmail(rawTicket.assignee));
            }

            return Promise.map(_.uniq(handlers), function(email) {
                return User.ensureUserByEmail(email)
                .then(function(user) {
                    return ticket.addHandler(user, creator);
                });
            }).return(ticket);
        })
        .then(function addTitle(ticket) {
            return Title.fetchOrCreate({
                ticketId: ticket.get("id"),
                createdById: creator.get("id"),
            })
            .then(function(title) {
                title.set({
                    createdAt: rawTicket.created_at,
                    title: rawTicket.title,
                });
                return title.save();
            }).return(ticket);
        })
        .then(function addComments(ticket) {
            return Promise.map(rawTicket.comments, function addOtherComment(rawComment) {

                if (!rawComment.commenter) {
                    console.log("------------");
                    console.log("NO COMMENTER on ticket", rawTicket.zendesk_id);
                    console.log("-----------------------------------------");
                    console.log(rawComment.comment);
                    console.log("-----------------------------------------");
                    return;
                }

                return User.byExternalId(rawComment.commenter.external_id).fetch({ require: true })
                .then(function addComment(commenter) {
                    return Comment.fetchOrCreate({
                        ticketId: ticket.get("id"),
                        createdById: commenter.get("id"),
                        createdAt: rawComment.created_at,
                        comment: rawComment.comment,
                        zendeskCommentId: ticket.get("id") + ":" + generateIdForComment(rawComment)
                    })
                    .then(function(comment) {
                        if (comment.isNew()) {
                            console.log("Adding new comment for".yellow, ticket.get("id"), "by", commenter.get("id"));
                        }
                        return comment.save();
                    });
                });
            }).return(ticket);
        })
        .then(function setUpdatedAt(ticket) {
            return ticket.comments().query(function(q) {
                q.orderBy("createdAt", "desc");
                q.limit(1);
            })
            .fetchOne()
            .then(function(comment) {
                ticket.set({ updatedAt: comment.get("createdAt") });
                return ticket.save();
            }).return(ticket);
        })
        .then(function(ticket) {
            return ticket.markAsRead(creator).return(ticket);
        });
    });

}


var count = 0;

function processTickets(tickets) {
    if (tickets.length === 0) return;
    return addTicket(tickets[0])
    .then(function(ticket) {
        count++;
        if (ticket) {
            console.log("Sync ok for", "ticket", ticket.get("id"), ticket.get("zendeskTicketId"));
        }
        return processTickets(tickets.slice(1));
    });
}

processTickets(require("../data"))
.then(function() {
        console.log("Added", count, "tickets");
        process.exit();
})
.catch(function(err) {
    console.log(err);
    console.log(err.stack);
    process.exit(1);
});

