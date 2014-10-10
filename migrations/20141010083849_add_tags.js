'use strict';

var Ticket = require("app/models/server/Ticket");

/**
 * Make sure that current tickets have corresponding `organisation:*` and `handler:*` tags
 **/
exports.up = function(knex, Promise) {

    return Ticket.fetchAll({
        withRelated: ["handlers.handler", "createdBy"]
    })
    .then(function(coll) { return coll.models; })
    .map(function(ticket) {
        var user = ticket.relations.createdBy;
        return Promise.join(
            ticket.addTag("organisation:" + user.getOrganisationDomain(), user),
            Promise.all(ticket.relations.handlers.map(function(handler) {
                return ticket.addTag("handler:" + handler.get("handler"), handler.get("handler"));
            }))
        );
    });
};

exports.down = function(knex, Promise) {
  
};
