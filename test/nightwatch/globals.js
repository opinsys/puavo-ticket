"use strict";
process.env.NODE_ENV = "acceptance";

var exec = require('child_process').exec;
var Promise = require("bluebird");

require("app/test/helpers");
var db = require("app/db");

var server = null;

var disconnect = Promise.promisify(db.knex.destroy.bind(db.knex));

module.exports = {
    before: function(done) {
        if (!process.env.START_TEST_SERVER) return done();
        server = exec("node server > acceptance-test-server.log 2>&1");
        done();
    },

    after: function(done) {
        disconnect().then(function() {
            if (!server) return;
            return new Promise(function(resolve, reject){
                server.on("error", reject);
                server.on("exit", resolve);
                server.kill();
            });
        })
        .then(done.bind(null))
        .catch(done);
    }
};
