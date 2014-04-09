var Backbone = require("backbone");
var Promise = require("bluebird");

var Base = Backbone.Model.extend({

    save: function() {
        var self = this;
        self.trigger("save:start");

        this.saving = Promise.cast(
            Backbone.Model.prototype.save.apply(this, arguments)
        ).delay(1000).then(function() {
            self.saving = null;
            self.trigger("save:end");
        });

        return this.saving;
    },

    fetch: function() {
        var self = this;
        self.trigger("fetch:start");

        this.fetching = Promise.cast(
            Backbone.Model.prototype.fetch.apply(this, arguments)
        ).then(function() {
            self.fetching = null;
            self.trigger("fetch:end");
        });

        return this.fetching;
    },


    isOperating: function() {
        return !!(this.saving || this.fetching);
    }

});

module.exports = Base;
