"use strict";

/**
 * Express middleware for simulating slow internet connections.
 * Set slowness to SLOW environment variable as milliseconds.
 *
 * @namespace utils.middleware
 * @class createSlowInternet
 * @constructor
 * @param {Number} [time] to wait before responding to requests
 * @return {Function} connect middleware
 */
function createSlowInternet(time) {
    return function(req, res, next) {
        time = parseInt(process.env.SLOW || time, 10);
        if (!time) return next();
        setTimeout(next.bind(this, null), time);
    };
}

module.exports = createSlowInternet;
