"use strict";

require("../../db");
var Base = require("./Base");

/**
 * Attachments for {{#crossLink "models.server.Ticket"}}{{/crossLink}}
 *
 * @namespace models.server
 * @extends models.server.Base
 * @class Attachment
 */
var Attachment = Base.extend({

    tableName: "attachments",

    defaults: function() {
        return {
            created: new Date(),
            updated: new Date()
        };
    }
});

module.exports = Attachment;
