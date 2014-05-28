"use strict";
var Base = require("./Base");
var $ = require("jquery");
var Promise = require("bluebird");


/**
 * Ticket handler model for the client
 *
 * @namespace models.client
 * @class Handler
 * @extends models.client.Base
 */
var Handler = Base.extend({

    save: Base.promiseWrap("saving", function() {
        var self = this;

        return Promise.cast($.post(this.collection.ticket.url() + "/handlers", {
            username: this.get("user").get("external_data").username,
            organisation_domain: this.get("user").get("external_data").organisation_domain
        }))
        .then(function(res) {
            self.set(res);
        });
    }),

});

module.exports = Handler;