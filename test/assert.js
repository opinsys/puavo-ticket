// https://github.com/domenic/chai-as-promised#assert-interface
var chai = require("chai");
chai.use(require("chai-as-promised"));
module.exports = chai.assert;
