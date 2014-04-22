"use strict";
var assert = require("assert");
var helpers = require("../helpers");

var UserSession = require("../../models/UserSession");

describe("UserSession", function() {

    before(function() {
        this.user = new UserSession(helpers.user.teacher);
    });

    it("has user visibility", function() {
        assert(this.user.getVisibilities().indexOf("user:9324") !== -1);
    });

    it("has organisation visibility", function() {
        assert(this.user.getVisibilities().indexOf("organisation:testing.opinsys.fi") !== -1);
    });

    it("has school visibility", function() {
        assert(this.user.getVisibilities().indexOf("school:234") !== -1);
    });




});
