"use strict";

var url = require("url");
var winston = require("winston");
var WinstonChild = require("../WinstonChild");
var uuid = require("uuid");

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
    var child = new WinstonChild(winston, {
        method: req.method,
        path: url.parse(req.url).pathname,
        reqUuid: uuid.v4()
    });
    req.logger = child;

    next = next || noop;
    if (res._responseTime) return next();
    var writeHead = res.writeHead;
    var start = Date.now();
    res._responseTime = true;
    res.writeHead = function(){
      var duration = Date.now() - start;
      res.setHeader('X-Response-Time', duration + 'ms');

      var meta = {
        duration: duration,
        headers: req.headers,
        statusCode: res.statusCode
      };

      if (req.body) meta.body = req.body;
      if (req.params) meta.body = req.params;

      req.logger.info("request end", meta);

      writeHead.apply(res, arguments);
    };
    next();
  };
}

module.exports = createResponseLogger;
