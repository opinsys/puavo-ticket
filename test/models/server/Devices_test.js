"use strict";

var helpers = require("../../helpers");

var Device = require("../../../models/server/Device");
var assert = require("assert");

describe("Device model", function() {

    before(function() {
        return helpers.clearTestDatabase();
    });

    it("Instance can be created", function() {
        return Device.forge({
                hostname: "fatclient-01"
            })
            .save()
            .then(function(device) {
                return Device.forge({ id: device.get("id") }).fetch();
            })
            .then(function(device) {
                assert.equal("fatclient-01", device.get("hostname"));
            });


    });
});
