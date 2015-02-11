"use strict";

require("colors");

var _ = require("lodash");
var Promise = require("bluebird");
var crypto = require('crypto');
var exec = require("child_process").exec;
var request = require("request");
var Readable = require('stream').Readable;
var winston = require('winston');
winston.add(winston.transports.File, { filename: 'import-' + Date.now() + '.log' });

var Ticket = require("app/models/server/Ticket");
var User = require("app/models/server/User");
var Comment = require("app/models/server/Comment");
var Title = require("app/models/server/Title");
var Tag = require("app/models/server/Tag");


if (!process.argv[2]) {
    console.error("xml dir arg missing");
    process.exit(1);
}

function addAttachments(rawComment, comment) {
    return Promise.map(rawComment.attachments, function(attachment) {
        winston.info("Fetching attachment", {
            url:attachment.url,
            comment: comment.toJSON()
        });

        return new Promise(function(resolve, reject){
            var req = new Readable().wrap(request(attachment.url)).on("error", reject);
            resolve(comment.addAttachment(
                attachment.filename,
                attachment.dataType,
                req
            ));
        })
        .catch(function(err) {
            winston.error("Attachment fetch failed", {
                url: attachment.url,
                comment: comment.toJSON()
            });
        });
    });
}

function setStatus(ticket, creator, rawTicket) {
            var status = rawTicket.status;
            if (!status) {
                winston.warn("Invalid status in zendeskID:%s title:%s", rawTicket.zendesk_id, rawTicket.title, {
                    rawTicket: rawTicket
                });
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
        }

function generateIdForComment(rawComment) {
    var shasum = crypto.createHash('sha1');
    shasum.update(rawComment.created_at);
    shasum.update(rawComment.commenter.external_id);
    return shasum.digest('hex');
}


function ensureUser(data) {

    if (!data.external_id) {
        return User.ensureUserByEmail(data.email, data.name, "");
    }

    return User.byExternalId(data.external_id).fetch()
    .then(function(user) {
        if (user) return user;

        return User.forge({
            externalId: data.external_id,
            externalData: {
                id: data.external_id,
                email: data.email,
                first_name: data.name,
                last_name: ""
            }
        }).save();
    });

}


function addTicket(rawTicket) {
    if (!rawTicket.title) {
        winston.warn("Ticket has no title zendeskID:%s", rawTicket.zendesk_id, {
            rawTicket: rawTicket
        });
        rawTicket.title = "Ei otsikkoa. Zendesk ID: " + rawTicket.zendesk_id;
    }

    return ensureUser(rawTicket.submitter)
    .then(function(creator) {
        return Ticket.fetchOrCreate({
            zendeskTicketId: rawTicket.zendesk_id
        })
        .then(function(ticket) {
            ticket.meta = {
                isNew: ticket.isNew(),
                comments: 0,
                newComments: 0
            };

            ticket.set({
                createdById: creator.get("id"),
                createdAt: rawTicket.created_at,
            });

            return ticket.save();
        })
        .then(function addOrganisationTag(ticket) {
            return ticket.addTag("organisation:" + rawTicket.organisation, creator).return(ticket);
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
                    return ticket.addHandler(user, creator)
                    .then(function() { return ticket.markAsRead(user); });
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
            return Promise.each(rawTicket.comments, function addOtherComment(rawComment) {

                if (!rawComment.commenter) {
                    winston.error("NO COMMENTER on ticket zendeskID:%s", rawTicket.zendesk_id, {
                        rawComment: rawComment
                    });
                    return;
                }

                return ensureUser(rawComment.commenter)
                .then(function addComment(commenter) {
                    return Comment.fetchOrCreate({
                        ticketId: ticket.get("id"),
                        zendeskCommentId: ticket.get("id") + ":" + generateIdForComment(rawComment)
                    })
                    .then(function(comment) {
                        ticket.meta.comments++;
                        comment.set({
                            hidden: !rawComment.is_public,
                            createdById: commenter.get("id"),
                            createdAt: rawComment.created_at,
                            comment: rawComment.comment,
                        });

                        if (comment.isNew()) {
                            ticket.meta.newComments++;
                            return comment.save().then(addAttachments.bind(null, rawComment, comment));
                        } else {
                            return comment.save();
                        }
                    })
                    .then(function() {
                        return ticket.markAsRead(commenter);
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
        })
        .then(function(ticket) {
            return setStatus(ticket, creator, rawTicket);
        });
    });

}


var count = 0;
var durations = 0;

function processTickets(tickets) {
    if (tickets.length === 0) return;
    var started = Date.now();
    return addTicket(tickets[0])
    .then(function(ticket) {
        count++;
        var diff = (Date.now() - started) / 1000;
        if (ticket) {
            durations += diff;
            var avg = durations / count;
            var remainingTickets = tickets.length - 1;

            winston.info("Ticket %s/%s synced", count, remainingTickets, {
                ID: ticket.get("id"),
                zendeskID: ticket.get("zendeskTicketId"),
                isNew: ticket.meta.isNew,
                newComments: ticket.meta.newComments,
                totalComments: ticket.meta.comments,
                tookSec: diff,
                avgSec:  avg,
                etaMin: (avg * remainingTickets) / 60
            });

        }
        return processTickets(tickets.slice(1));
    });
}

exec("extra/zendesk2json.rb " + process.argv[2], {maxBuffer: 1024 * 50000}, function(err, stdout, stderr) {
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


