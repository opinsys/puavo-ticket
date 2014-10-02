"use strict";

var re = /^.+([0-9]+)\+(.+)@(.+)$/;

/**
 * Parse ticket id and email secret from a reply email address
 *
 * @param {String} email Email string eg. foo@example.com
 * @return {Object}
 */
function parseReplyEmailAddress(email) {
    var m = re.exec(email);
    if (!m) return null;

    return {
        ticketId: parseInt(m[1], 10),
        emailSecret: m[2],
        domain: m[3],
    };

}

module.exports = parseReplyEmailAddress;
