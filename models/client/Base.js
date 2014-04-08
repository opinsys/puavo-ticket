var Backbone = require("backbone");
var Promise = require("bluebird");

var Base = Backbone.Model.extend({

    save: function() {
        var self = this;

        this.saving = Promise.cast(
            Backbone.Model.prototype.save.apply(this, arguments)
        ).then(function() {
            self.saving = null;
            self.trigger("save:done");
        });

        return this.saving;
    },

    fetch: function() {
        var self = this;

        this.fetching = Promise.cast(
            Backbone.Model.prototype.fetch.apply(this, arguments)
        ).then(function() {
            self.fetching = null;
            self.trigger("fetch:done");
        });

        return this.fetching;
    },


    isOperating: function() {
        console.log("saving", this.saving);
        console.log("fetching", this.fetching);
        return !!(this.saving || this.fetching);
    }

});

module.exports = Base;
