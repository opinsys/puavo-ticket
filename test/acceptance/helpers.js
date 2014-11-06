"use strict";
process.env.NODE_ENV = "acceptance";

var wd = require("wd");

require("app/test/helpers");
var config = require("app/config");
var Promise = require("bluebird");
var app = require("app/server");

var browser = wd.promiseChainRemote();

var url = "http://" + config.domain + ":" + config.port;


function login(username, password) {
    return browser
    .elementByCss("input[name=username]").type(username)
    .elementByCss("input[name=password]").type(password)
    .elementByCss("input[type=submit]").click()
    .waitForElementByCss(".Main")
    ;
}

function logout() {
    return browser.get(url + "/logout");
}

before(function() {
    if (!process.env.START_TEST_SERVER) return;
    return new Promise(function(resolve, reject){
        app.listen(config.port, function(err) {
            if (err) return reject(err);
            resolve();
        });
    });
});

module.exports = {
    url: url,
    browserName: "firefox",
    browser: browser,
    login: login,
    logout: logout
};
