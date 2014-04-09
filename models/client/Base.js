var Backbone = require("backbone");
var Promise = require("bluebird");


function promiseWrap(name, orig) {
    return function() {
        var self = this;
        self.trigger(name + ":start");

        self[name] = Promise.delay(1000) // simulate slow network
        .then(function() {
            return Promise.cast(orig.apply(self, arguments));
        })
        .then(function() {
            self[name] = null;
            self.trigger(name + ":end");
        });

        return self[name];
    };
}

var Base = Backbone.Model.extend({

    fetch: promiseWrap("fetching", Backbone.Model.prototype.fetch),

    save: promiseWrap("saving", Backbone.Model.prototype.save),

    isOperating: function() {
        return !!(this.saving || this.fetching);
    }

});

Base.Collection = Backbone.Collection.extend({
    fetch: promiseWrap("fetching", Backbone.Collection.prototype.fetch),
});

module.exports = Base;
