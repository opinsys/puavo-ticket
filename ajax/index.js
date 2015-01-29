"use strict";
var Actions = require("../Actions");

require("./ticket");
require("./notifications");
require("./views");

setImmediate(Actions.views.fetch);
setImmediate(Actions.notifications.fetch);
