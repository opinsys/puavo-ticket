"use strict";

var Base = require("./Base");

var Attachment = Base.extend({

    /**
     * Return true if the attachment is an image which can be displayed in a
     * <img> tag
     *
     * @method isImage
     * @return {Boolean}
     */
    isImage: function(){
        // Matches "image/jpeg" and "image/png" for example
        return /^ *image/i.test(this.get("dataType"));
    },

    /**
     * Return url to this attachment
     *
     * @method toURL
     * @return {String}
     */
    toURL: function() {
        var comment = this.parent;
        var ticket = comment.parent;
        return [
            "/api/tickets/",
            ticket.get("id"),
            "/comments/",
            comment.get("id"),
            "/attachments/",
            this.get("id"),
            "/",
            this.get("filename")
        ].join("");
    },

});


module.exports = Attachment;
