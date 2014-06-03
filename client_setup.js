var Promise = require("bluebird");
Promise.longStackTraces();
var $ = require("jquery");
var Backbone = require("backbone");
Backbone.$ = $;

var React = require("react/addons");
// React devtools requires a global access to the React object to work
// http://fb.me/react-devtools 
window.React = React;
