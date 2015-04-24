"use strict";


var enquire = require("enquire.js");

enquire.register("screen and (min-width: 45em)", {
    setup : function() {
        // Load in content via AJAX (just the once)
    },
    match : function() {
        console.log("BiiiiiG");
    },
});

