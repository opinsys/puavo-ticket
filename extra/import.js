"use strict";

require("colors");
process.env.BLUEBIRD_DEBUG = "true";

var _ = require("lodash");
var Promise = require("bluebird");
var crypto = require('crypto');
var exec = require("child_process").exec;
var request = require("request");
var Readable = require('stream').Readable;

var Ticket = require("app/models/server/Ticket");
var User = require("app/models/server/User");
var Comment = require("app/models/server/Comment");
var Title = require("app/models/server/Title");
var Tag = require("app/models/server/Tag");


if (!process.argv[2]) {
    console.error("xml dir arg missing");
    process.exit(1);
}


function generateIdForComment(rawComment) {
    var shasum = crypto.createHash('sha1');
    shasum.update(rawComment.created_at);
    shasum.update(rawComment.commenter.external_id);
    return shasum.digest('hex');
}


function ensureUser(data) {
    var userOp;
    if (data.external_id) {
        userOp = User.byExternalId(data.external_id).fetch()
        .then(function(user) {
            if (user) return user;
            return User.forge({
                externalData: {
                    email: data.email,
                    first_name: data.name,
                    last_name: ""
                }
            }).save();
        });
    } else {
        userOp = User.ensureUserByEmail(data.email, data.name, "");
    }

    return userOp;
}


function addTicket(rawTicket) {
    if (!rawTicket.title) {
        console.log("Ticket has no title".red, rawTicket.zendesk_id);
        return Promise.resolve();
    }
    return ensureUser(rawTicket.submitter)
    .then(function(creator) {
        return Ticket.fetchOrCreate({
            zendeskTicketId: rawTicket.zendesk_id
        })
        .then(function(ticket) {

            if (ticket.isNew()) {
                console.log("Adding new ticket from zendesk id".yellow, ticket.get("zendeskTicketId"));
            } else {
                console.log("Updating existing ticket".green, ticket.get("id"), ticket.get("zendeskTicketId"));
            }

            ticket.set({
                createdById: creator.get("id"),
                createdAt: rawTicket.created_at,
            });

            return ticket.save();
        })
        .then(function addOrganisationTag(ticket) {
            console.log("Adding tag", "organisation:" + rawTicket.organisation);
            return ticket.addTag("organisation:" + rawTicket.organisation, creator).return(ticket);
        })
        .then(function setStatus(ticket) {
            var status = rawTicket.status;
            if (!status) {
                console.error("Invalid status in".red, rawTicket.zendesk_id, rawTicket.title);
                status = "open";
            }

            return Tag.fetchOrCreate({
                tag: "status:" + rawTicket.status,
                ticketId: ticket.get("id"),
            }, { noSoftDeleted: true })
            .then(function(tag) {
                if (tag.isNew()) {
                    tag.set({
                        createdAt: new Date(),
                    });
                }
                tag.set({
                    createdById: creator.get("id"),
                });
                return tag.save();
            })
            .return(ticket);
        })
        .then(function addHandlers(ticket) {

            var handlers = [rawTicket.submitter];

            if (rawTicket.requester) {
                handlers.push(rawTicket.requester);
            }

            if (rawTicket.assignee) {
                handlers.push(rawTicket.assignee);
            }

            handlers = _.uniq(handlers, function(data) {
                return data.email;
            });

            return Promise.each(handlers, function(data) {
                return ensureUser(data)
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

                return ensureUser(rawComment.commenter)
                .then(function addComment(commenter) {
                    return Comment.fetchOrCreate({
                        ticketId: ticket.get("id"),
                        zendeskCommentId: ticket.get("id") + ":" + generateIdForComment(rawComment)
                    })
                    .then(function(comment) {
                        if (comment.isNew()) {
                            console.log("Adding new comment for".yellow, ticket.get("id"), "by", commenter.get("id"));
                        }
                        comment.set({
                            createdById: commenter.get("id"),
                            createdAt: rawComment.created_at,
                            comment: rawComment.comment,
                        });
                        return comment.save();
                    })
                    .then(function addAttachments(comment) {
                        return Promise.map(rawComment.attachments, function(attachment) {
                            console.log("Fetching attachment", attachment.url);
                            return new Promise(function(resolve, reject){
                                var req = new Readable().wrap(request(attachment.url)).on("error", reject);
                                resolve(comment.addAttachment(
                                    attachment.filename,
                                    attachment.dataType,
                                    req
                                ));
                            });
                        });
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

exec("extra/zendesk2json.rb " + process.argv[2], {maxBuffer: 1024 * 500}, function(err, stdout, stderr) {
    console.error(stderr);
    if (err) {
        console.error("Failed to execute extra/zendesk2json.rb");
        console.error(err);
        process.exit(1);
    }

    console.log("zendesk2json.rb OK");
    processTickets(JSON.parse(stdout.toString()))
    .then(function() {
            console.log("Added", count, "tickets");
            process.exit();
    })
    .catch(function(err) {
        console.log(err);
        console.log(err.stack);
        process.exit(1);
    });


});


