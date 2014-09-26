"use strict";

process.env.BLUEBIRD_DEBUG = "true";

var _ = require("lodash");
var Promise = require("bluebird");

var Ticket = require("app/models/server/Ticket");
var User = require("app/models/server/User");
var Comment = require("app/models/server/Comment");
var Title = require("app/models/server/Title");
var Tag = require("app/models/server/Tag");


function addTicket(rawTicket) {
    return User.byExternalId(rawTicket.submitter.external_id)
    .fetch({ require: true })
    .then(function(creator) {
        return Ticket.fetchOrCreate({
            createdById: creator.get("id"),
            createdAt: rawTicket.created_at,
            zendeskTicketId: rawTicket.zendesk_id
        })
        .then(function(ticket) {
            return ticket.save();
        })
        .then(function setStatus(ticket) {
            var status = rawTicket.status;
            if (!status) {
                console.error("Invalid status in", rawTicket.zendesk_id);
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
            var handlers = [rawTicket.submitter.external_id];

            if (rawTicket.requester) {
                handlers.push(rawTicket.requester.external_id);
            }

            if (rawTicket.assignee) {
                handlers.push(rawTicket.assignee.external_id);
            }

            return Promise.map(_.uniq(handlers), function(external_id) {
                return User.byExternalId(external_id)
                .fetch({ require: true })
                .then(function(user) {
                    return ticket.addHandler(user, creator);
                    // .catch(function(err) {
                    //     // console.log("Failed to add handler", external_id, err);
                    // });
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
                    title: rawTicket.title,
                });
                return title.save();
            }).return(ticket);
        })
        .then(function addDescriptionComment(ticket) {

            return Comment.fetchOrCreate({
                ticketId: ticket.get("id"),
                zendeskCommentId: "description:" + ticket.get("id")
            })
            .then(function(comment) {
                comment.set({
                    createdById: creator.get("id"),
                    createdAt: rawTicket.created_at,
                    comment: rawTicket.description,
                });
                return comment.save();
            }).return(ticket);
        })
        .then(function addOtherComments(ticket) {
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
                        // zendeskCommentId: ticket.get("id") + ":" + rawComment.zendesk_id
                    })
                    .then(function(comment) {
                        return comment.save();
                    });
                });
            }).return(ticket);
        });
    });

}


var count = 0;

function processTickets(tickets) {
    if (tickets.length === 0) return;
    return addTicket(tickets[0])
    .then(function(ticket) {
        count++;
        console.log(count, "id:", ticket.get("id"));
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

