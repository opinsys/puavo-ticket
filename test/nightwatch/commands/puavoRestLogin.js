"use strict";

var config = require("app/config");

exports.command = function(username, password) {
    this.url("http://" + config.domain + ":" + config.port)
    .waitForElementVisible("body", 1000)
    .setValue("input[name=username]", username)
    .setValue("input[name=password]", password)
    .click("input[type=submit]")
    .waitForElementVisible(".Main", 5000);
    return this;
};

