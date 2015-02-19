"use strict";

var Promise = require("bluebird");
var _ = require("lodash");
var Email = require("../models/server/Email");

function submitLimboReplies(emails) {
    return Promise.resolve(emails).filter(email => email.isReply())
    .each(email => {


        return email.submitAsReplyAuto()
        .tap(comment => comment.load("createdBy"))
        .then(comment => comment.set({
            createdAt: email.get("createdAt"),
            comment:  "(tämä viesti palautettiin email-limbosta. t. opinsys-kehitys)\n" + comment.get("comment")
        }).save())
        .tap(comment => {
            console.log(
                "New comment: https://support.opinsys.fi/tickets/"+ email.getTicketId() +"/discuss",
                "by", comment.rel("createdBy").getEmail()
            );

        });

    })
    .then((emails) => {
        console.log("Replies submitted", emails.length);
    });
}

function submitLimboTickets(emails) {
    return Promise.resolve(emails).filter(email => !email.isReply())
    .each(email => {
        return email.submitAsNewTicket()
        .then(ticket => ticket.set({ createdAt: email.get("createdAt") }).save())
        .then(ticket => ticket.load("comments"))
        .tap(ticket => Promise.each(ticket.rel("comments").toArray(), (comment) => {
            return comment.set({ createdAt: email.get("createdAt") }).save();
        }))
        .then((ticket) => {
            console.log(
                "New ticket: https://support.opinsys.fi/tickets/"+ ticket.get("id") +"/discuss"
            );
        });
    })
    .then((emails) => {
        console.log("Tickets submitted", emails.length);
    });

}



Email.collection()
.query(q => {
    q.whereNull("commentId");
})
.fetch()
.then(c => c.models)
// .then(emails => _.uniq(emails, (e) => e.getContentUUID()))
.then(emails => {
    var grouppedEmails = _.groupBy(emails, (e) => e.getContentUUID());
    console.log("Unique emails found", Object.keys(grouppedEmails).length);
    _.forEach(grouppedEmails, (dups) => {
        console.log("Duplicates in a group", dups.length);
    });

    var unique = [];
    return Promise.each(_.values(grouppedEmails), (dups) => {
        if (dups.length === 0) return;
        if (dups.length === 1) {
            unique.push(_.first(dups));
            return;
        }
        unique.push(_.first(dups));
        return Promise.each(_.rest(dups), (dup) => dup.destroy());
    })
    .then(() => unique);
})
.tap(submitLimboReplies)
.tap(submitLimboTickets)
.then(function() {
    console.log("ok");
    process.exit();
})
.catch(err => {
    console.error(err);
    console.error(err.stack);
    process.exit(1);
});
