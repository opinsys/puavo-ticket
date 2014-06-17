"use strict";

var debug = require("debug")("puavo-ticket:utils/middleware/createResponseLogger");

function noop() {}

/**
 *
 * Add X-Response-Time and log response paths and times with console.log.
 *
 * Adapted from https://github.com/expressjs/response-time
 *
 * @namespace utils.middleware
 * @class createResponseLogger
 * @constructor
 * @return {Function} connect middleware
 */
function createResponseLogger(){
  return function(req, res, next){
    // express Router middlewares can alter this. Save it before continuing.
    var reqUrl = req.url;

    next = next || noop;
    if (res._responseTime) return next();
    var writeHead = res.writeHead;
    var start = Date.now();
    res._responseTime = true;
    res.writeHead = function(){
      var duration = Date.now() - start;
      res.setHeader('X-Response-Time', duration + 'ms');
      debug(req.method + " " + reqUrl + " " + duration + 'ms');
      writeHead.apply(res, arguments);
    };
    next();
  };
}

module.exports = createResponseLogger;
