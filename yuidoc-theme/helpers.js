"use strict";
var Handlebars = require("yuidocjs/node_modules/handlebars");
module.exports = {
    ref: function(ref) {
        return Handlebars.SafeString(
            "<a href='/doc/classes/" + ref + ".html'>" + ref + "</a>"
        );
    }
};
