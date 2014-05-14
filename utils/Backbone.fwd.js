"use strict";

/**
 * Forward events from one Backbone object, through another.
 *
 * Adapted from https://github.com/derickbailey/backbone.fwd
 *
 * @namespace utils
 * @class Backbone
 *
 * @static
 * @method fwd
 * @param {Backbone.Events} source
 * @param {Object} options
 */
function fwd(source, options){
  options = options || {};

  /*jshint validthis:true */
  this.listenTo(source, "all", function(){
    var args = Array.prototype.slice.call(arguments);
    var eventName = args.shift();

    // handle prefix for event name
    if (options.prefix){
      eventName = options.prefix + ":" + eventName;
    }

    // handle suffix for event name
    if (options.suffix){
      eventName = eventName + ":" + options.suffix;
    }

    args.unshift(eventName);
    this.trigger.apply(this, args);
  });
}

module.exports = fwd;
