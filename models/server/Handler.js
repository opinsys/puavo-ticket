
"use strict";

require("../../db");

var Promise = require("bluebird");

var Base = require("./Base");
var User = require("./User");


/**
 * Handler for {{#crossLink "models.server.Ticket"}}{{/crossLink}}
 *
 * @namespace models.server
 * @extends models.server.Base
 * @class Handler
 */
var Handler = Base.extend({

    tableName: "handlers",

    initialize: function() {
        this.on("creating", this._assertCreatorIsManagerOrOwner.bind(this));
    },

    _assertCreatorIsManagerOrOwner: function() {
        return Promise.all([
            User.byId(this.get("createdById")).fetch({ require: true }),
            this.ticket().fetch({ require: true })      
        ])
        .spread(function(user, ticket){
            if (user.isManager()) return;
            if (ticket.get("createdById") === user.get("id")) return;
            throw new Error("Only managers or owners can add handlers");
        });
    },

    defaults: function() {
        return {
            createdAt: new Date(),
            updatedAt: new Date()
        };
    },

    handler: function() {
        return this.belongsTo(User, "handler");
    },
    
    ticket: function() {
        var Ticket = require("./Ticket");
        return this.belongsTo(Ticket, "ticket_id");
    },    

    createdBy: function() {
        return this.belongsTo(User, "createdById");
    }

});

module.exports = Handler;
