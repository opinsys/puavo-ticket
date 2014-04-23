"use strict";

require("../../db");
var Bookshelf = require("bookshelf");

/**
 * Attachments for {{#crossLink "models.server.Ticket"}}{{/crossLink}}
 *
 * @namespace models.server
 * @extends Bookshelf.Model
 * @class Attachment
 */
var Attachment = Bookshelf.DB.Model.extend({

  tableName: "attachments",

  defaults: function() {
      return {
          created: new Date(),
          updated: new Date()
      };
  }

});

module.exports = Attachment;
