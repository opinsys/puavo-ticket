"use strict";
var assert = require("assert");
var helpers = require("../helpers");

var User = require("../../models/User");

describe("User", function() {

    before(function() {
        this.user = new User(helpers.user.teacher);
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
