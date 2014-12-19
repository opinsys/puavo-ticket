"use strict";


var _ = require("lodash");
var Promise = require("bluebird");

var User = require("app/models/server/User");
var Comment = require("app/models/server/Comment");
var Ticket = require("app/models/server/Ticket");
var View = require("app/models/server/View");
var Visibility = require("app/models/server/Visibility");
var Title = require("app/models/server/Title");
var Handler = require("app/models/server/Handler");
var Follower = require("app/models/server/Follower");
var Attachment = require("app/models/server/Attachment");
var Notification = require("app/models/server/Notification");
var Tag = require("app/models/server/Tag");

function fixUserRel(Model, dupIds, user, rel) {
    if (!rel) throw new Error("rel not set");

    return Model.collection()
    .query(function(q) {
        q.whereIn(rel, dupIds);
    })
    .fetch()
    .then(function(coll) { return coll.models })
    .each(function(model) {
        var ob = {};
        ob[rel] = user.get("id");
        return model.set(ob).save()
        .then(function() {
            console.log(
                "Fixed duplicate", Model.prototype.tableName,
                "rows for", user.getFullName(),
                "from ticket", model.get("ticketId"));
        })
        .catch(ConstraintError, function(err) {
            console.log(
                "Deleting duplicate row on", Model.prototype.tableName,
                "for", user.getFullName(),
                "from ticket", model.get("ticketId"));
            return model.destroy();
        });
    });
}


function getFirstUser(userArray) {
    var externalIdUsers = userArray.filter(function(user) {
        return !!user.getExternalId();
    });

    if (externalIdUsers.length > 1) {
        console.log("Duplicate emails");
        console.log(externalIdUsers.map(function(user) {
            return user.getDomainUsername();
        }));
    }

    if (externalIdUsers.length > 0) {
        return _.min(externalIdUsers, function(user) {
            return parseInt(user.getExternalId(), 10);
        });
    }

    var firstUser = _.min(userArray, function(user) {
        return user.get("id");
    });

    return firstUser;
}

function ConstraintError(err) {
    return err && /duplicate key value violates unique constraint/.test(err.message);
}


function setLatest(notifications) {
    var latest = _.max(notifications, function(n) {
        return new Date(n.get("readAt")).getTime();
    });

    return Promise.each(notifications, function(n) {
        return n.set({ readAt: latest.get("readAt") }).save();
    });
}

User.collection()
.query(function(q) {
    // q.limit(100);
})
.fetch()
.then(function(coll) {
    var users = {};
    coll.forEach(function(user) {
        var email = user.getEmail();
        if (email) {
            var l = users[email] || [];
            l.push(user);
            users[user.getEmail()] = l;
        }
    });

    var dupUsers = [];
    _.forEach(users, function(userArray, email) {
        if (userArray.length > 1) {
            dupUsers.push(userArray);
        }
    });
    return dupUsers;
})
.each(function(userArray) {
    var user = getFirstUser(userArray);
    var id = user.get("id");

    var dupUsers = userArray.filter(function(user) {
        return user.get("id") !== id;
    });

    var dupIds = dupUsers.map(function(user) {
        return user.get("id");
    });


    // Fid comments
    return Comment.collection()
    .query(function(q) {
        q.whereIn("createdById", dupIds);
    })
    .fetch()
    .then(function(coll) {
        return coll.models;
    })
    .each(function(comment) {
        return comment.set({ createdById: id }).save();
    })
    .then(function(comments) {
        if (comments.length > 0) {
            console.log("Fixed", comments.length, "comments for", user.getFullName());
        }
    })




    // Fix handlers
    .then(function() {
        return fixUserRel(Handler, dupIds, user, "handler");
    })
    .then(function() {
        return fixUserRel(Handler, dupIds, user, "deletedById");
    })
    .then(function() {
        return fixUserRel(Handler, dupIds, user, "createdById");
    })


    // Fix views
    .then(function() {
        return fixUserRel(View, dupIds, user, "createdById");
    })


    // Fix followers
    .then(function() {
        return fixUserRel(Follower, dupIds, user, "followedById");
    })
    .then(function() {
        return fixUserRel(Follower, dupIds, user, "deletedById");
    })
    .then(function() {
        return fixUserRel(Follower, dupIds, user, "createdById");
    })


    // Fix attachments
    .then(function(val) {
        return Attachment.collection()
        .query(function(q) {
            q.whereIn("createdById", dupIds);
        })
        .fetch();
    })
    .then(function(coll) { return coll.models; })
    .each(function(attachment) {
        return attachment.set({ createdById: id }).save();
    })
    .then(function(attachments) {
        if (attachments.length > 0) {
            console.log("Fixed", attachments.length, "attachments for", user.getFullName());
        }
    })

    // Fix tickets
    .then(function() {
        return fixUserRel(Ticket, dupIds, user, "createdById");
    })

    // Fix titles
    .then(function() {
        return fixUserRel(Title, dupIds, user, "createdById");
    })

    // Fix visibilities
    .then(function() {
        return fixUserRel(Visibility, dupIds, user, "createdById");
    })

    // Fix tags
    .then(function() {
        return fixUserRel(Tag, dupIds, user, "createdById");
    })
    .then(function() {
        return fixUserRel(Tag, dupIds, user, "deletedById");
    })

    // Fix notifications
    .then(function() {
        return Notification.collection()
        .query(function(q) {
            q.whereIn("targetId", dupIds);
        })
        .fetch();
    })
    .then(function(coll) {
        var byTickets = _.values(_.groupBy(coll.models, function(m) {
            return m.get("ticketId");
        }));
        return Promise.each(byTickets, setLatest).return(coll.models);
    })
    .each(function(notification) {
        return notification.set({ targetId: id }).save()
        .then(function() {
            console.log("Fixed notification", user.getFullName(), "for ticket", notification.get("ticketId"));
        })
        .catch(ConstraintError, function(err) {
            console.log("Deleting dup notification", user.getFullName(), "for ticket", notification.get("ticketId"));
            return notification.destroy();
        });
    })

    // Ensure following
    .then(function() {
        return Comment.collection()
        .query(function(q) {
            q.where("createdById", id);
        })
        .fetch({ withRelated: "ticket" })
        .then(function(coll) {
            var tickets = coll.map(function(c) {
                return c.rel("ticket");
            });

            tickets = _.uniq(tickets, function(t) {
                return t.get("id");
            });

            return tickets;
        })
        .each(function(ticket) {
            return ticket.addFollower(user, user);
        });
    })


    // Delete duplicate users
    .then(function() {
        console.log("Deleting users!!!!!!");
        return dupUsers;
    })
    .each(function(user) {
        return user.destroy();
    })
    .then(function(users) {
        if (users.length > 0) {
            console.log("Deleted", users.length, "duplicate users for", user.getFullName());
        }
    });

})
.then(function() {
    console.log("ALL OK");
    process.exit(0);
})
.catch(function(err) {
    console.log(err);
    console.log(err.stack);
    process.exit(1);
});
