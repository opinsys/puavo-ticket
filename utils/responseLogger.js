"use strict";

function noop() {}

/**
 *
 * Add X-Response-Time and log response paths and times with console.log.
 *
 * Adapted from https://github.com/expressjs/response-time
 *
 * @class responseLogger
 * @constructor
 * @return {Function} connect middleware
 */
module.exports = function responseTime(){
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
      console.log(req.method, reqUrl, duration + 'ms');
      writeHead.apply(res, arguments);
    };
    next();
  };
};
