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
            created_at: new Date(),
            updated_at: new Date()
        };
    }
});

module.exports = Attachment;
