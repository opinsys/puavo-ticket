"use strict";
process.env.ACCEPTANCE = 1;

var wd = require("wd");
var Promise = require("bluebird");
var asserters = wd.asserters;

require("app/test/helpers");
var config = require("app/config");
var app = require("app/server");
var writeFile = Promise.promisify(require("fs").writeFile);

var browser = wd.promiseChainRemote();
var takeScreenshot = Promise.promisify(browser.takeScreenshot, browser);

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

// Capture screenshot of the browser on failures
afterEach(function() {
    if (this.currentTest.state !== "failed") return;
    return takeScreenshot()
    .then(function(screenshot) {
        return writeFile("failure.png", new Buffer(screenshot, "base64"));
    });
});


/**
 * Safe text include asserter for the wd module. Works just like the original
 * asserters.textInclude but does not crash with StaleElementReferenceException
 * if the matched element is removed from the DOM during waiting
 */
function safeTextInclude(content) {
  return new asserters.Asserter(
    function(target, cb) {
      target.text(function(err, text) {
        if(err) {
            if (err.cause && err.cause.value["class"] === "org.openqa.selenium.StaleElementReferenceException") {
                return cb(null, undefined); // expected error - return as unsatisfied
            }
            return cb(err);
        }
        var satisfied = text && text.indexOf(content) > -1;
        cb(null, satisfied, satisfied? text : undefined);
      });
    }
  );
}

module.exports = {
    url: url,
    browserName: "firefox",
    browser: browser,
    login: login,
    logout: logout,
    safeTextInclude: safeTextInclude
};
