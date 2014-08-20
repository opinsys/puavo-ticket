"use strict";

require("../../db");

var Promise = require("bluebird");

var User = require("./User");
var Base = require("./Base");

/**
 * Title for {{#crossLink "models.server.Ticket"}}{{/crossLink}}
 *
 * @namespace models.server
 * @extends models.server.Base
 * @class Title
 */
var Title = Base.extend({

    tableName: "titles",

    defaults: function() {
        return {
            createdAt: new Date(),
            updatedAt: new Date()
        };
    },

    initialize: function() {
        this.on("creating", this._assertCreatorIsHandler.bind(this));
    },

    _assertCreatorIsHandler: function() {
        return Promise.all([
            this.ticket().fetch({ withRelated: "handlerUsers", require: true  }),
            this.createdBy().fetch({ require: true })
        ]).spread(function(ticket, user) {
            if (!ticket.isHandler(user)) {
                throw new Error("Only handlers can add titles");
            }
        });
    },

    /**
     * @method ticket
     * @return {models.server.Ticket}
     */
    ticket: function() {
        var Ticket = require("./Ticket");
        return this.belongsTo(Ticket, "ticketId");
    },

    /**
     * @method createdBy
     * @return {models.server.User}
     */
    createdBy: function() {
        return this.belongsTo(User, "createdById");
    },

    /**
     * Text for email notification when this model has changed
     *
     * @method textToEmail
     * @return {String}
     */
    textToEmail: function() {
        var self = this;

        return self.get("title");
    }

});

module.exports = Title;
