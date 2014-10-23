"use strict";

exports.command = function waitForAjax() {
    // Wait for all spinner to disapear
    this.waitForElementNotVisible(".Loading,.fa-spin", 5000);
    return this;
};
